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
    const { source_ids, title, research_question, paper_type = 'research_paper' } = body

    if (!source_ids || source_ids.length === 0) {
      return NextResponse.json({ error: 'source_ids required' }, { status: 400 })
    }

    // Verify user owns all sources
    const { data: sources } = await (supabase as any)
      .from('sources')
      .select(`id, title, summaries (summary_text, key_topics)`)
      .in('id', source_ids)
      .eq('user_id', user.id)

    if (!sources || sources.length === 0) {
      return NextResponse.json({ error: 'Sources not found' }, { status: 404 })
    }

    // Build context
    const sourceContext = sources.map((s: any, idx: number) =>
      `[${idx + 1}] ${s.title}\n${s.summaries?.[0]?.summary_text || ''}`
    ).join('\n\n')

    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    // Generate paper structure using AI
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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const content = data.content[0].text

    let paper: any
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      paper = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch (e) {
      paper = { title: 'Generated Paper', abstract: '', sections: [{ title: 'Content', content }] }
    }

    const fullContent = `# ${paper.title}\n\n**Abstract**\n\n${paper.abstract}\n\n` +
      paper.sections.map((s: any) => `## ${s.title}\n\n${s.content}`).join('\n\n')

    // Save to database
    const { data: output } = await (supabase as any)
      .from('published_outputs')
      .insert({
        user_id: user.id,
        output_type: 'academic_paper',
        title: title || paper.title,
        content: fullContent,
        metadata: { paper_type, research_question, source_count: sources.length },
        status: 'draft',
      })
      .select()
      .single()

    // Link sources
    const links = source_ids.map((sid: string) => ({ output_id: output.id, source_id: sid }))
    await (supabase as any).from('output_sources').insert(links)

    return NextResponse.json({ output, paper }, { status: 201 })
  } catch (error) {
    console.error('Paper generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
