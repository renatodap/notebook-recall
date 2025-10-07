import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { RateLimitError } from '@/lib/errors/custom-errors'
import { DatabaseSource } from '@/types/api'
import { unifiedChatCompletion } from '@/lib/ai-router/unified-client'
import { TaskType } from '@/lib/ai-router'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting check
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.AI_CHAT)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `You have reached your daily limit of ${RATE_LIMITS.AI_CHAT.maxRequests} chat messages. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const body = await request.json()
    const { question, source_ids } = body

    if (!question?.trim()) {
      return NextResponse.json({ error: 'question required' }, { status: 400 })
    }

    // Get sources
    const { data: sources } = await supabase
      .from('sources')
      .select('id, title, summaries (summary_text)')
      .in('id', (source_ids || []) as any)
      .eq('user_id', user.id)
      .limit(10)

    if (!sources || sources.length === 0) {
      return NextResponse.json({ error: 'No sources found' }, { status: 404 })
    }

    // Build context from sources
    const context = sources.map((s: any, idx: number) =>
      `[Source ${idx + 1}: ${s.title}]\n${s.summaries?.[0]?.summary_text || ''}`
    ).join('\n\n---\n\n')

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

    const aiResult = await unifiedChatCompletion({
      messages: [{ role: 'user', content: prompt }],
      taskType: TaskType.COMPLEX_REASONING,
      needsHighAccuracy: true,
      budget: 'medium',
      max_tokens: 3000
    })

    console.log(`💰 Q&A cost: $${aiResult.estimatedCost.toFixed(6)} (${aiResult.provider}/${aiResult.model})`)
    const content = aiResult.content

    let result: any
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      result = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch {
      result = { answer: content, confidence: 0.8, sources_used: [], key_points: [], limitations: '' }
    }

    // Save Q&A to database
    await supabase
      .from('qa_history')
      .insert({
        user_id: user.id,
        question,
        answer: result.answer,
        source_ids,
        confidence: result.confidence,
        metadata: { key_points: result.key_points, limitations: result.limitations },
      } as any)

    return NextResponse.json({ ...result, source_count: sources.length }, {
      headers: {
        'X-RateLimit-Limit': RATE_LIMITS.AI_CHAT.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
      }
    })
  } catch (error) {
    console.error('Q&A error:', error)

    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          error: error.message,
          retryAfter: error.retryAfter
        },
        { status: 429 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
