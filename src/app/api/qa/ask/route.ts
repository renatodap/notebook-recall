import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { question, source_ids } = body

    if (!question?.trim()) {
      return NextResponse.json({ error: 'question required' }, { status: 400 })
    }

    // Get sources
    const { data: sources } = await (supabase as any)
      .from('sources')
      .select('id, title, summaries (summary_text)')
      .in('id', source_ids || [])
      .eq('user_id', user.id)
      .limit(10)

    if (!sources || sources.length === 0) {
      return NextResponse.json({ error: 'No sources found' }, { status: 404 })
    }

    // Build context from sources
    const context = sources.map((s: any, idx: number) =>
      `[Source ${idx + 1}: ${s.title}]\n${s.summaries?.[0]?.summary_text || ''}`
    ).join('\n\n---\n\n')

    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const prompt = `Answer this question based on the following research sources. Cite sources by number.

Question: ${question}

Sources:
${context}

Provide a comprehensive answer that:
1. Directly addresses the question
2. Synthesizes information across sources
3. Cites specific sources [1], [2], etc.
4. Notes any conflicting information
5. Indicates if sources don't fully answer the question

Return JSON:
{
  "answer": "Comprehensive answer with citations",
  "confidence": 0.0-1.0,
  "sources_used": [1, 2, 3],
  "key_points": ["Point 1", "Point 2"],
  "limitations": "What the sources don't cover"
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const content = data.content[0].text

    let result: any
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      result = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch (e) {
      result = { answer: content, confidence: 0.8, sources_used: [], key_points: [], limitations: '' }
    }

    // Save Q&A to database
    await (supabase as any)
      .from('qa_history')
      .insert({
        user_id: user.id,
        question,
        answer: result.answer,
        source_ids,
        confidence: result.confidence,
        metadata: { key_points: result.key_points, limitations: result.limitations },
      })

    return NextResponse.json({ ...result, source_count: sources.length })
  } catch (error) {
    console.error('Q&A error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
