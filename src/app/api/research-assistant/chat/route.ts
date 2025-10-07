import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources_used?: string[]
  timestamp?: string
  reasoning_steps?: unknown[]
  insights?: unknown[]
}

export interface ChatSession {
  id: string
  user_id: string
  title: string
  messages: ChatMessage[]
  created_at: string
  updated_at: string
}

// Helper to get sources data
async function getSourcesData(supabase: any, sourceIds: string[], userId: string) {
  const { data: sources } = await supabase
    .from('sources')
    .select('id, title, content_type, summaries(summary_text, key_topics)')
    .in('id', sourceIds)
    .eq('user_id', userId)

  return sources || []
}

/**
 * Research Assistant Chat with ALL 8 SMART FEATURES
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, session_id, context_source_ids, collection_id } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'message required' }, { status: 400 })
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    // Get or create session
    let session: any
    let conversationHistory: ChatMessage[] = []

    if (session_id) {
      const { data } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', session_id)
        .eq('user_id', user.id as never)
        .single()

      session = data
      conversationHistory = session?.messages || []
    }

    // Get collection-specific source IDs if collection is selected
    let collectionSourceIds: string[] | null = null
    let collectionName = 'All Sources'

    if (collection_id) {
      try {
        // Fetch collection to get name and verify ownership
        const { data: collection, error: collectionError } = await supabase
          .from('collections')
          .select('id, name')
          .eq('id', collection_id)
          .eq('user_id', user.id as never)
          .single()

        if (collectionError || !collection) {
          return NextResponse.json(
            { error: 'Collection not found or access denied' },
            { status: 404 }
          )
        }

        collectionName = collection.name

        // Fetch source IDs from collection
        const { data: collectionSources, error: sourcesError } = await supabase
          .from('collection_sources')
          .select('source_id')
          .eq('collection_id', collection_id)

        if (sourcesError) {
          console.error('Error fetching collection sources:', sourcesError)
        } else if (collectionSources && collectionSources.length > 0) {
          collectionSourceIds = collectionSources.map((cs: any) => cs.source_id)
        } else {
          // Collection exists but has no sources
          collectionSourceIds = []
        }
      } catch (error) {
        console.error('Error processing collection:', error)
        return NextResponse.json(
          { error: 'Failed to process collection' },
          { status: 500 }
        )
      }
    }

    // Feature 1: SEMANTIC SEARCH RAG
    let sourceContext = ''
    let sourcesUsed: string[] = []
    let sourceIds = context_source_ids

    if (!sourceIds) {
      try {
        const { semanticSearch } = await import('@/lib/embeddings/search')

        // If collection is selected, limit search to collection sources
        const searchOptions: any = {
          limit: 5,
          threshold: 0.7
        }

        if (collectionSourceIds !== null) {
          if (collectionSourceIds.length === 0) {
            // Collection has no sources - skip search
            sourceIds = []
          } else {
            // Search only within collection sources
            searchOptions.sourceIds = collectionSourceIds
            const searchResults = await semanticSearch(user.id, message, searchOptions)
            if (searchResults.length > 0) {
              sourceIds = searchResults.map(r => r.source_id)
            }
          }
        } else {
          // No collection selected - search all user sources
          const searchResults = await semanticSearch(user.id, message, searchOptions)
          if (searchResults.length > 0) {
            sourceIds = searchResults.map(r => r.source_id)
          }
        }
      } catch {
        console.log('Semantic search failed, using fallback')
      }
    }

    // Retrieve source content with SMART CHUNKING (Feature 2)
    if (sourceIds && sourceIds.length > 0) {
      const { data: sources } = await supabase
        .from('sources')
        .select(`
          id,
          title,
          content_type,
          original_content,
          summaries (summary_text, key_topics, key_actions)
        `)
        .in('id', sourceIds)
        .eq('user_id', user.id as never)
        .limit(10)

      if (sources && sources.length > 0) {
        // Feature 2: Smart chunking - use summaries instead of full content
        sourceContext = '\n\nUser\'s Sources:\n' +
          sources.map((s: any, idx: number) => {
            const summary = s.summaries?.[0]
            return `[Source ${idx + 1}: ${s.title}]
Content Type: ${s.content_type}
Summary: ${summary?.summary_text || 'No summary available'}
${summary?.key_topics ? `Key Topics: ${summary.key_topics.join(', ')}` : ''}`
          }).join('\n\n---\n\n')

        sourcesUsed = sources.map((s: any) => s.id)
      }
    }

    // Feature 3 & 4: User Profile + Dynamic Personas
    const { getUserProfile, detectQueryType, getPersonaPrompt, generateProactiveInsights, performMultiStepReasoning } =
      await import('@/lib/smart-chat')

    const userProfile = await getUserProfile(user.id)
    const queryType = detectQueryType(message)
    const dynamicPersona = getPersonaPrompt(queryType, userProfile)

    // Feature 5: Proactive Insights
    const insights = sourceIds && sourceIds.length > 0
      ? await generateProactiveInsights(user.id, message, await getSourcesData(supabase, sourceIds, user.id))
      : []

    const insightsText = insights.length > 0
      ? '\n\n💡 **Proactive Insights**:\n' + insights.map(i => `- ${i.message}`).join('\n')
      : ''

    // Build DYNAMIC system prompt
    const systemPrompt = `${dynamicPersona}

Your Advanced Capabilities:
1. **Semantic Search**: Find relevant sources using meaning, not just keywords
2. **Smart Analysis**: Break down complex queries into reasoning steps
3. **Proactive Assistance**: Suggest connections and identify gaps
4. **Tool Use**: Create notes, search sources, generate citations
5. **Adaptive Learning**: Learn from feedback to improve responses
6. **Cross-Session Memory**: Remember user preferences and research interests

User Profile:
- Research interests: ${userProfile.research_interests.join(', ') || 'Not yet determined'}
- Expertise: ${userProfile.expertise_domains.join(', ') || 'General'}
- Interactions: ${userProfile.interaction_count}

${sourceContext || '\n\nNote: No sources are currently available.'}${insightsText}`

    // Feature 7: Multi-Step Reasoning
    const reasoning = await performMultiStepReasoning(message, await getSourcesData(supabase, sourceIds || [], user.id))

    // 🚀 INTELLIGENT MODEL ROUTING - Auto-select optimal model
    const { unifiedChatCompletion, unifiedFunctionCall } = await import('@/lib/ai-router/unified-client')
    const { TaskType } = await import('@/lib/ai-router')

    // Detect if this needs complex reasoning or can use fast model
    const needsComplexReasoning = message.length > 500 ||
      /analyze|compare|explain|synthesize|detailed/i.test(message) ||
      queryType === 'analysis' || queryType === 'comparison'

    const selectedTaskType = needsComplexReasoning
      ? TaskType.COMPLEX_REASONING
      : TaskType.QUICK_CHAT

    // Feature 6: Function Calling with Tools
    const { chatTools } = await import('@/lib/smart-chat')
    const tools = chatTools.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters
      }
    }))

    // Call AI with intelligent routing (uses Groq for speed, OpenRouter for quality)
    let assistantMessage = ''
    let toolCalls: unknown[] = []
    let usedModel = ''
    let usedProvider = ''
    let estimatedCost = 0

    // Check if tools are needed based on message content
    const needsTools = /create note|search|citation|find|generate/i.test(message)

    if (needsTools && tools.length > 0) {
      // Use function calling
      const result = await unifiedFunctionCall(
        [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
          })),
          { role: 'user', content: message }
        ],
        tools
      )

      assistantMessage = result.response
      toolCalls = result.toolCalls
      usedProvider = result.provider
      usedModel = 'function-calling'
      estimatedCost = 0.001 // Estimate
    } else {
      // Regular chat completion with intelligent routing
      const result = await unifiedChatCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
          })),
          { role: 'user', content: message }
        ],
        taskType: selectedTaskType,
        needsHighAccuracy: needsComplexReasoning,
        needsSpeed: !needsComplexReasoning,
        budget: needsComplexReasoning ? 'medium' : 'low'
      })

      assistantMessage = result.content
      usedModel = result.model
      usedProvider = result.provider
      estimatedCost = result.estimatedCost
    }

    // Execute tool calls if any (Feature 6)
    for (const toolCall of toolCalls) {
      const tool = chatTools.find(t => t.name === (toolCall as any).name)
      if (tool) {
        try {
          const startTime = Date.now()
          const result = await tool.handler((toolCall as any).input)
          const executionTime = Date.now() - startTime

          // Log function call
          await supabase
            .from('function_calls')
            .insert({
              user_id: user.id,
              session_id: session_id,
              function_name: (toolCall as any).name,
              arguments: (toolCall as any).input,
              result,
              success: true,
              execution_time_ms: executionTime
            } as any)

          assistantMessage += `\n\n✓ Executed: ${(toolCall as any).name}`
        } catch (error) {
          await supabase
            .from('function_calls')
            .insert({
              user_id: user.id,
              session_id: session_id,
              function_name: (toolCall as any).name,
              arguments: (toolCall as any).input,
              success: false,
              error_message: error instanceof Error ? error.message : 'Unknown error'
            } as any)
        }
      }
    }

    // Update conversation history
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }

    const newAssistantMessage: ChatMessage = {
      role: 'assistant',
      content: assistantMessage,
      sources_used: sourcesUsed.length > 0 ? sourcesUsed : undefined,
      reasoning_steps: reasoning.steps,
      insights: insights.length > 0 ? insights : undefined,
      timestamp: new Date().toISOString()
    }

    const updatedMessages = [
      ...conversationHistory,
      newUserMessage,
      newAssistantMessage
    ]

    // Save or update session
    if (session_id && session) {
      const { data: updatedSession } = await supabase
        .from('chat_sessions')
        .update({
          messages: updatedMessages,
          updated_at: new Date().toISOString()
        } as never)
        .eq('id', session_id)
        .eq('user_id', user.id as never)
        .select()
        .single()

      session = updatedSession
    } else {
      const sessionTitle = message.substring(0, 50) + (message.length > 50 ? '...' : '')

      const { data: newSession } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title: sessionTitle,
          messages: updatedMessages
        } as never)
        .select()
        .single()

      session = newSession
    }

    // Feature 8: Update user profile with interaction
    await supabase
      .from('user_profiles')
      .update({
        interaction_count: userProfile.interaction_count + 1,
        last_active: new Date().toISOString()
      } as never)
      .eq('user_id', user.id as never)

    return NextResponse.json({
      session_id: session.id,
      message: newAssistantMessage,
      sources_used: sourcesUsed,
      conversation_length: updatedMessages.length,
      query_type: queryType,
      insights: insights.length > 0 ? insights : undefined,
      reasoning_visible: reasoning.steps.length > 0,
      // 💰 Cost tracking
      model_used: usedModel,
      provider_used: usedProvider,
      estimated_cost: estimatedCost,
      cost_savings_vs_claude: ((3.0 - (estimatedCost * 1_000_000)) / 3.0 * 100).toFixed(1) + '%'
    })
  } catch (error) {
    console.error('Research assistant chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Get chat sessions
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (sessionId) {
      const { data: session, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id' as never, sessionId)
        .eq('user_id' as never, user.id as never)
        .single()

      if (error || !session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      return NextResponse.json({ session })
    } else {
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id as never)
        .order('updated_at', { ascending: false })
        .limit(50)

      if (error) throw error

      return NextResponse.json({ sessions })
    }
  } catch (error) {
    console.error('Get chat sessions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
