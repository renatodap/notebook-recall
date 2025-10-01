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

    // Get relevant sources if context provided
    let sourceContext = ''
    let sourcesUsed: string[] = []

    if (context_source_ids && context_source_ids.length > 0) {
      const { data: sources } = await (supabase as any)
        .from('sources')
        .select('id, title, summaries (summary_text)')
        .in('id', context_source_ids)
        .eq('user_id', user.id)
        .limit(10)

      if (sources && sources.length > 0) {
        sourceContext = '\n\nRelevant Sources:\n' +
          sources.map((s: any, idx: number) =>
            `[Source ${idx + 1}: ${s.title}]\n${s.summaries?.[0]?.summary_text || ''}`
          ).join('\n\n')

        sourcesUsed = sources.map((s: any) => s.id)
      }
    }

    // Build conversation context
    const systemPrompt = `You are an expert research assistant helping an academic researcher. You can:

1. **Answer Research Questions**: Provide detailed, accurate answers with citations
2. **Analyze Sources**: Summarize, compare, and critique research papers
3. **Suggest Directions**: Recommend research questions, methodologies, and areas to explore
4. **Writing Help**: Assist with academic writing, citations, and structuring papers
5. **Methodology Advice**: Help design studies and choose appropriate methods
6. **Literature Synthesis**: Identify themes, gaps, and connections across sources

Always:
- Be precise and evidence-based
- Cite sources when using them (e.g., [Source 1])
- Ask clarifying questions when needed
- Suggest next steps or related questions
- Be supportive and encouraging

${sourceContext}`

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
