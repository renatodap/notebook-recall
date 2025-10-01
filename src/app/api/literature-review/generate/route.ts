import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { generateReviewFromTemplate, REVIEW_TEMPLATES, ReviewType } from '@/lib/academic/review-templates'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { source_ids, template_type, title, custom_prompts } = body

    if (!source_ids || source_ids.length === 0) {
      return NextResponse.json({ error: 'source_ids required' }, { status: 400 })
    }

    if (!template_type || !REVIEW_TEMPLATES[template_type as ReviewType]) {
      return NextResponse.json({ error: 'Valid template_type required' }, { status: 400 })
    }

    // Get sources
    const { data: sources } = await (supabase as any)
      .from('sources')
      .select('id, title, summaries (summary_text)')
      .in('id', source_ids)
      .eq('user_id', user.id)

    if (!sources || sources.length === 0) {
      return NextResponse.json({ error: 'Sources not found' }, { status: 404 })
    }

    const sourcesForReview = sources.map((s: any) => ({
      title: s.title,
      summary_text: s.summaries?.[0]?.summary_text || ''
    }))

    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    // Generate review using template
    const review = await generateReviewFromTemplate(
      template_type as ReviewType,
      sourcesForReview,
      anthropicKey,
      custom_prompts
    )

    const template = REVIEW_TEMPLATES[template_type as ReviewType]

    // Build markdown content
    const markdownContent = `# ${review.title}\n\n` +
      `*${template.description}*\n\n` +
      review.sections.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n')

    // Save to published_outputs
    const { data: output } = await (supabase as any)
      .from('published_outputs')
      .insert({
        user_id: user.id,
        output_type: 'literature_review',
        title: title || review.title,
        content: markdownContent,
        metadata: {
          template_type,
          source_count: sources.length,
          word_count: markdownContent.split(/\s+/).length,
          sections: review.sections.map((s: any) => s.title)
        },
        status: 'draft'
      })
      .select()
      .single()

    // Link sources
    const links = source_ids.map((sid: string) => ({
      output_id: output.id,
      source_id: sid
    }))
    await (supabase as any).from('output_sources').insert(links)

    return NextResponse.json({ output, review, template }, { status: 201 })
  } catch (error) {
    console.error('Literature review generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return available templates
    const templates = Object.entries(REVIEW_TEMPLATES).map(([key, template]) => ({
      type: key,
      title: template.title,
      description: template.description,
      wordCount: template.wordCount,
      sections: template.sections.map(s => ({
        title: s.title,
        description: s.description
      }))
    }))

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Get templates error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
