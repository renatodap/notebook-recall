import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { GeneratePaperRequestSchema } from '@/lib/validation/schemas'
import {
  RateLimitError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import type { DatabaseSource } from '@/types/api'
import { unifiedChatCompletion } from '@/lib/ai-router/unified-client'
import { TaskType } from '@/lib/ai-router'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to generate academic papers')
    }

    // Rate limiting check
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.AI_PUBLISHING)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `You have reached your daily limit of ${RATE_LIMITS.AI_PUBLISHING.maxRequests} publishing requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    // Validate request body
    const body = await request.json()
    const validation = GeneratePaperRequestSchema.safeParse(body)

    if (!validation.success) {
      throw new ValidationError(validation.error.issues[0].message)
    }

    const { source_ids, title, research_question, paper_type, citation_style } = validation.data

    // Verify user owns all sources
    const { data: sources } = await supabase
      .from('sources')
      .select(`id, title, summaries (summary_text, key_topics)`)
      .in('id', source_ids)
      .eq('user_id', user.id)

    if (!sources || sources.length === 0) {
      throw new NotFoundError('Sources not found or access denied')
    }

    // Build context
    const sourceContext = sources.map((s: any, idx: number) =>
      `[${idx + 1}] ${s.title}\n${s.summaries?.[0]?.summary_text || ''}`
    ).join('\n\n')

    // Generate paper structure using cost-optimized AI router
    const prompt = `You are an academic writing assistant. Generate an academic paper structure from these sources.

${research_question ? `Research Question: ${research_question}\n\n` : ''}Paper Type: ${paper_type}

Sources:
${sourceContext}

Generate a structured academic paper including:
1. Abstract (150-250 words)
2. Introduction with background and research objectives
3. Literature Review organized thematically
4. Methodology/Approach
5. Analysis/Discussion
6. Conclusions and Future Work
7. References section

Return JSON:
{
  "title": "Paper title",
  "abstract": "Abstract text",
  "sections": [
    {"title": "Introduction", "content": "Content in markdown"},
    {"title": "Literature Review", "content": "Content in markdown"}
  ]
}`

    const result = await unifiedChatCompletion({
      messages: [{ role: 'user', content: prompt }],
      taskType: TaskType.CREATIVE_WRITING,
      needsHighAccuracy: true,
      budget: 'medium',
      max_tokens: 8000
    })

    console.log(`💰 Paper generation cost: $${result.estimatedCost.toFixed(6)} (${result.provider}/${result.model})`)
    const content = result.content

    let paper: any
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      paper = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch {
      paper = { title: 'Generated Paper', abstract: '', sections: [{ title: 'Content', content }] }
    }

    const fullContent = `# ${paper.title}\n\n**Abstract**\n\n${paper.abstract}\n\n` +
      paper.sections.map((s: any) => `## ${s.title}\n\n${s.content}`).join('\n\n')

    // Save to database
    const { data: output } = await supabase
      .from('published_outputs')
      .insert({
        user_id: user.id,
        output_type: 'academic_paper',
        title: title || paper.title,
        content: fullContent,
        metadata: { paper_type, research_question, citation_style, source_count: sources.length },
        status: 'draft',
      } as never)
      .select()
      .single()

    // Link sources
    const links = source_ids.map((sid: string) => ({ output_id: (output as any).id, source_id: sid }))
    await supabase.from('output_sources').insert(links as never)

    return NextResponse.json({ output, paper }, {
      status: 201,
      headers: {
        'X-RateLimit-Limit': RATE_LIMITS.AI_PUBLISHING.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
      }
    })
  } catch (error) {
    console.error('Paper generation error:', error)
    return handleAPIError(error)
  }
}
