import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { generateBlogPost } from '@/lib/publishing/blog-generator'

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
      title,
      target_audience = 'general',
      tone = 'professional',
      length = 'medium',
      focus,
      custom_instructions,
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

    // Prepare sources for blog generation
    const blogInput = sources.map((s: any) => ({
      id: s.id,
      title: s.title,
      summary: s.summaries?.[0]?.summary_text,
      key_topics: s.summaries?.[0]?.key_topics,
    }))

    // Generate blog post using AI
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const blogPost = await generateBlogPost(
      {
        sources: blogInput,
        target_audience,
        tone,
        length,
        focus,
        custom_instructions,
      },
      anthropicKey
    )

    // Save to database
    const { data: output, error: outputError } = await (supabase as any)
      .from('published_outputs')
      .insert({
        user_id: user.id,
        output_type: 'blog_post',
        title: title || blogPost.title,
        content: blogPost.content,
        metadata: {
          ...blogPost.metadata,
          subtitle: blogPost.subtitle,
          seo_title: blogPost.seo_title,
          seo_description: blogPost.seo_description,
          tags: blogPost.tags,
          estimated_reading_time: blogPost.estimated_reading_time,
          target_audience,
          tone,
          length,
        },
        status: 'draft',
      })
      .select()
      .single()

    if (outputError) {
      console.error('Save output error:', outputError)
      return NextResponse.json({ error: 'Failed to save blog post' }, { status: 500 })
    }

    // Link sources to output
    const links = source_ids.map((sid: string) => ({
      output_id: output.id,
      source_id: sid,
    }))

    await (supabase as any)
      .from('output_sources')
      .insert(links)

    return NextResponse.json({ output, blog_post: blogPost }, { status: 201 })
  } catch (error) {
    console.error('Blog generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
