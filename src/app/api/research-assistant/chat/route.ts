import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources_used?: string[]
  timestamp?: string
}

export interface ChatSession {
  id: string
  user_id: string
  title: string
  messages: ChatMessage[]
  created_at: string
  updated_at: string
}

/**
 * Research Assistant Chat
 * Conversational AI that can answer questions, suggest research directions,
 * analyze sources, and help with academic writing
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, session_id, context_source_ids } = body

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
      const { data } = await (supabase as any)
        .from('chat_sessions')
        .select('*')
        .eq('id', session_id)
        .eq('user_id', user.id)
        .single()

      session = data
      conversationHistory = session?.messages || []
    }

    // Get relevant sources
    let sourceContext = ''
    let sourcesUsed: string[] = []

    // Check if user is asking about their sources
    const isAskingAboutSources = /summarize|source|recent|paper|article|document|what did i|what have i/i.test(message)

    let sourceIds = context_source_ids

    // If no explicit source IDs provided but user is asking about sources, get recent ones
    if (!sourceIds && isAskingAboutSources) {
      const { data: recentSources } = await (supabase as any)
        .from('sources')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (recentSources && recentSources.length > 0) {
        sourceIds = recentSources.map((s: any) => s.id)
      }
    }

    // Retrieve source content
    if (sourceIds && sourceIds.length > 0) {
      const { data: sources } = await (supabase as any)
        .from('sources')
        .select(`
          id,
          title,
          content_type,
          original_content,
          summaries (summary_text, key_topics, key_actions)
        `)
        .in('id', sourceIds)
        .eq('user_id', user.id)
        .limit(10)

      if (sources && sources.length > 0) {
        sourceContext = '\n\nUser\'s Sources:\n' +
          sources.map((s: any, idx: number) => {
            const summary = s.summaries?.[0]
            return `[Source ${idx + 1}: ${s.title}]
Content Type: ${s.content_type}
Summary: ${summary?.summary_text || 'No summary available'}
${summary?.key_topics ? `Key Topics: ${summary.key_topics.join(', ')}` : ''}
${s.original_content ? `\nFull Content:\n${s.original_content.substring(0, 2000)}${s.original_content.length > 2000 ? '...' : ''}` : ''}`
          }).join('\n\n---\n\n')

        sourcesUsed = sources.map((s: any) => s.id)
      }
    }

    // Build conversation context
    const systemPrompt = `You are an expert research assistant helping an academic researcher. You have access to the user's research sources and can help them understand, analyze, and synthesize their materials.

Your capabilities:
1. **Analyze & Summarize**: Provide clear summaries and insights from the user's sources
2. **Answer Questions**: Use the user's sources to answer research questions
3. **Compare & Contrast**: Identify similarities, differences, and connections between sources
4. **Suggest Directions**: Recommend research questions, methodologies, and areas to explore
5. **Writing Help**: Assist with academic writing, citations, and structuring papers
6. **Literature Synthesis**: Identify themes, gaps, and connections across sources

Always:
- Use the provided sources to answer questions accurately
- Cite sources when referencing them (e.g., [Source 1])
- Be specific and evidence-based in your responses
- If the user asks about "my source" or "recent sources", refer to the sources provided below
- Be supportive and encouraging

${sourceContext || '\n\nNote: No sources are currently available. If the user asks about their sources, let them know they need to add sources first.'}`

    // Build messages array for Claude
    const messages = [
      ...conversationHistory.map(m => ({
        role: m.role,
        content: m.content
      })),
      {
        role: 'user',
        content: message
      }
    ]

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: systemPrompt,
        messages
      })
    })

    const data = await response.json()
    const assistantMessage = data.content[0].text

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
      timestamp: new Date().toISOString()
    }

    const updatedMessages = [
      ...conversationHistory,
      newUserMessage,
      newAssistantMessage
    ]

    // Save or update session
    if (session_id && session) {
      // Update existing session
      const { data: updatedSession } = await (supabase as any)
        .from('chat_sessions')
        .update({
          messages: updatedMessages,
          updated_at: new Date().toISOString()
        })
        .eq('id', session_id)
        .eq('user_id', user.id)
        .select()
        .single()

      session = updatedSession
    } else {
      // Create new session
      const sessionTitle = message.substring(0, 50) + (message.length > 50 ? '...' : '')

      const { data: newSession } = await (supabase as any)
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title: sessionTitle,
          messages: updatedMessages
        })
        .select()
        .single()

      session = newSession
    }

    return NextResponse.json({
      session_id: session.id,
      message: newAssistantMessage,
      sources_used: sourcesUsed,
      conversation_length: updatedMessages.length
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
      // Get specific session
      const { data: session, error } = await (supabase as any)
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single()

      if (error || !session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      return NextResponse.json({ session })
    } else {
      // Get all sessions for user
      const { data: sessions, error } = await (supabase as any)
        .from('chat_sessions')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id)
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
