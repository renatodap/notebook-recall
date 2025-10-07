import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { DatabaseSource } from '@/types/api'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { RateLimitError } from '@/lib/errors/custom-errors'
import { unifiedChatCompletion } from '@/lib/ai-router/unified-client'
import { TaskType } from '@/lib/ai-router'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.AI_PUBLISHING)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const body = await request.json()
    const { source_ids, title, audience = 'general', slide_count = 10 } = body

    if (!source_ids || source_ids.length === 0) {
      return NextResponse.json({ error: 'source_ids required' }, { status: 400 })
    }

    const { data: sources } = await supabase
      .from('sources')
      .select(`id, title, summaries (summary_text, key_topics)`)
      .in('id', source_ids as any)
      .eq('user_id', user.id)

    if (!sources || sources.length === 0) {
      return NextResponse.json({ error: 'Sources not found' }, { status: 404 })
    }

    const sourceContext = sources.map((s: any, idx: number) =>
      `[${idx + 1}] ${s.title}\n${s.summaries?.[0]?.summary_text || ''}`
    ).join('\n\n')

    const prompt = `Create a ${slide_count}-slide presentation from these sources for ${audience} audience.

Sources:
${sourceContext}

Generate presentation slides with:
- Title slide
- Agenda/Outline
- Key concepts (1 per slide)
- Visuals suggestions
- Conclusion with takeaways

Return JSON:
{
  "title": "Presentation title",
  "slides": [
    {
      "number": 1,
      "title": "Slide title",
      "content": ["Bullet point 1", "Bullet point 2"],
      "notes": "Speaker notes",
      "visual_suggestion": "What to show visually"
    }
  ]
}`

    const result = await unifiedChatCompletion({
      messages: [{ role: 'user', content: prompt }],
      taskType: TaskType.CREATIVE_WRITING,
      needsHighAccuracy: true,
      budget: 'medium',
      max_tokens: 6000
    })

    console.log(`💰 Presentation generation cost: $${result.estimatedCost.toFixed(6)} (${result.provider}/${result.model})`)
    const content = result.content

    let presentation: any
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      presentation = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch {
      presentation = { title: 'Presentation', slides: [] }
    }

    const markdownContent = `# ${presentation.title}\n\n` +
      presentation.slides.map((s: any) =>
        `---\n\n## ${s.title}\n\n${s.content.map((c: string) => `- ${c}`).join('\n')}\n\n*Notes: ${s.notes}*`
      ).join('\n\n')

    const { data: output } = await supabase
      .from('published_outputs')
      .insert({
        user_id: user.id,
        output_type: 'presentation',
        title: title || presentation.title,
        content: markdownContent,
        metadata: { slide_count: presentation.slides.length, audience, source_count: sources.length, slides: presentation.slides },
        status: 'draft',
      } as any)
      .select()
      .single()

    const links = source_ids.map((sid: string) => ({ output_id: (output as any).id, source_id: sid }))
    await supabase.from('output_sources').insert(links as any)

    return NextResponse.json({ output, presentation }, { status: 201 })
  } catch (error) {
    console.error('Presentation generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
