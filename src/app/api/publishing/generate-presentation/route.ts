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
    const { source_ids, title, audience = 'general', slide_count = 10 } = body

    if (!source_ids || source_ids.length === 0) {
      return NextResponse.json({ error: 'source_ids required' }, { status: 400 })
    }

    const { data: sources } = await (supabase as any)
      .from('sources')
      .select(`id, title, summaries (summary_text, key_topics)`)
      .in('id', source_ids)
      .eq('user_id', user.id)

    if (!sources || sources.length === 0) {
      return NextResponse.json({ error: 'Sources not found' }, { status: 404 })
    }

    const sourceContext = sources.map((s: any, idx: number) =>
      `[${idx + 1}] ${s.title}\n${s.summaries?.[0]?.summary_text || ''}`
    ).join('\n\n')

    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 6000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const content = data.content[0].text

    let presentation: any
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      presentation = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch (e) {
      presentation = { title: 'Presentation', slides: [] }
    }

    const markdownContent = `# ${presentation.title}\n\n` +
      presentation.slides.map((s: any) =>
        `---\n\n## ${s.title}\n\n${s.content.map((c: string) => `- ${c}`).join('\n')}\n\n*Notes: ${s.notes}*`
      ).join('\n\n')

    const { data: output } = await (supabase as any)
      .from('published_outputs')
      .insert({
        user_id: user.id,
        output_type: 'presentation',
        title: title || presentation.title,
        content: markdownContent,
        metadata: { slide_count: presentation.slides.length, audience, source_count: sources.length, slides: presentation.slides },
        status: 'draft',
      })
      .select()
      .single()

    const links = source_ids.map((sid: string) => ({ output_id: output.id, source_id: sid }))
    await (supabase as any).from('output_sources').insert(links)

    return NextResponse.json({ output, presentation }, { status: 201 })
  } catch (error) {
    console.error('Presentation generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
