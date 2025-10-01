import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const CreateSourceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content_type: z.enum(['text', 'url', 'pdf', 'note']),
  original_content: z.string().min(1, 'Content is required'),
  url: z.string().url().optional().nullable(),
  summary_text: z.string().min(1, 'Summary is required'),
  key_actions: z.array(z.string()),
  key_topics: z.array(z.string()),
  word_count: z.number().int().positive(),
})

/**
 * GET /api/sources - List all sources for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const contentType = searchParams.get('contentType')
    const sortBy = searchParams.get('sort') || 'newest'

    // Build query
    let query = supabase
      .from('sources')
      .select(
        `
        *,
        summary:summaries(*),
        tags:tags(*)
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)

    // Apply filters
    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    // Apply sorting
    if (sortBy === 'oldest') {
      query = query.order('created_at', { ascending: true })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
      hasMore: count ? from + limit < count : false,
    })
  } catch (error) {
    console.error('GET sources error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sources' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sources - Create a new source with summary
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate request
    const validation = CreateSourceSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const {
      title,
      content_type,
      original_content,
      url,
      summary_text,
      key_actions,
      key_topics,
      word_count,
    } = validation.data

    // Create source
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .insert({
        user_id: user.id,
        title,
        content_type,
        original_content,
        url,
      } as any)
      .select()
      .single()

    if (sourceError) {
      throw sourceError
    }

    // Create summary
    const { data: summary, error: summaryError } = await supabase
      .from('summaries')
      .insert({
        source_id: (source as any).id,
        summary_text,
        key_actions,
        key_topics,
        word_count,
      } as any)
      .select()
      .single()

    if (summaryError) {
      throw summaryError
    }

    // Create tags
    if (key_topics.length > 0) {
      const tagsData = key_topics.map((topic) => ({
        source_id: (source as any).id,
        tag_name: topic.toLowerCase(),
      }))

      const { error: tagsError } = await supabase
        .from('tags')
        .insert(tagsData as any)

      if (tagsError) {
        console.error('Tags creation error:', tagsError)
        // Don't fail the request if tags fail
      }
    }

    return NextResponse.json({
      source,
      summary,
    }, { status: 201 })
  } catch (error) {
    console.error('POST sources error:', error)
    return NextResponse.json(
      { error: 'Failed to create source' },
      { status: 500 }
    )
  }
}
