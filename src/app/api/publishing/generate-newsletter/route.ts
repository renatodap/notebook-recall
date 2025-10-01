import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { generateNewsletter, wrapNewsletterHTML } from '@/lib/publishing/newsletter-generator'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      source_ids,
      newsletter_name = 'Research Digest',
      theme,
      sections,
      tone = 'professional',
      format = 'html',
    } = body

    if (!source_ids || source_ids.length === 0) {
      return NextResponse.json({ error: 'source_ids required' }, { status: 400 })
    }

    // Verify user owns all sources
    const { data: sources, error: sourcesError } = await (supabase as any)
      .from('sources')
      .select(`
        id,
        title,
        summaries (
          summary_text,
          key_topics
        )
      `)
      .in('id', source_ids)
      .eq('user_id', user.id)

    if (sourcesError || !sources || sources.length === 0) {
      return NextResponse.json({ error: 'Sources not found or access denied' }, { status: 404 })
    }

    // Prepare sources for newsletter generation
    const newsletterInput = sources.map((s: any) => ({
      id: s.id,
      title: s.title,
      summary: s.summaries?.[0]?.summary_text,
      key_topics: s.summaries?.[0]?.key_topics,
    }))

    // Generate newsletter using AI
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const newsletter = await generateNewsletter(
      {
        sources: newsletterInput,
        newsletter_name,
        theme,
        sections,
        tone,
        format,
      },
      anthropicKey
    )

    // Wrap in HTML if needed
    const finalContent = format === 'html'
      ? wrapNewsletterHTML(newsletter, newsletter_name)
      : newsletter.content

    // Save to database
    const { data: output, error: outputError } = await (supabase as any)
      .from('published_outputs')
      .insert({
        user_id: user.id,
        output_type: 'newsletter',
        title: newsletter.subject_line,
        content: finalContent,
        metadata: {
          ...newsletter.metadata,
          newsletter_name,
          preview_text: newsletter.preview_text,
          sections: newsletter.sections,
          tone,
          format,
        },
        status: 'draft',
      })
      .select()
      .single()

    if (outputError) {
      console.error('Save output error:', outputError)
      return NextResponse.json({ error: 'Failed to save newsletter' }, { status: 500 })
    }

    // Link sources to output
    const links = source_ids.map((sid: string) => ({
      output_id: output.id,
      source_id: sid,
    }))

    await (supabase as any)
      .from('output_sources')
      .insert(links)

    return NextResponse.json({ output, newsletter }, { status: 201 })
  } catch (error) {
    console.error('Newsletter generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
