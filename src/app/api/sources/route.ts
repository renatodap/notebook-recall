import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/embeddings/client'
import { backfillEmbeddings } from '@/lib/embeddings/backfill'
import { generateTitle } from '@/lib/claude/client'
import { z } from 'zod'

const CreateSourceSchema = z.object({
  title: z.string().optional(),
  content_type: z.enum(['text', 'url', 'pdf', 'note', 'image']),
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
    const tagsParam = searchParams.get('tags')
    const tagLogic = searchParams.get('tagLogic') || 'OR'
    const collectionId = searchParams.get('collection_id')

    // Parse tag filter
    const filterTags = tagsParam
      ? tagsParam.split(',').map((t) => t.trim().toLowerCase())
      : []

    // Use database function for tag filtering if tags are specified
    if (filterTags.length > 0) {
      const { data, error } = await (supabase as any).rpc('get_sources_by_tags', {
        p_user_id: user.id,
        p_tags: filterTags,
        p_tag_logic: tagLogic,
        p_content_type: contentType || null,
        p_collection_id: collectionId || null,
        p_limit: limit,
        p_offset: (page - 1) * limit,
      })

      if (error) {
        throw error
      }

      // Fetch summaries and tags for each source
      const sourceIds = data.map((s: any) => s.id)
      const { data: summaries } = await (supabase as any)
        .from('summaries')
        .select('*')
        .in('source_id', sourceIds)

      const { data: tags } = await (supabase as any)
        .from('tags')
        .select('*')
        .in('source_id', sourceIds)

      // Combine data
      const enrichedData = data.map((source: any) => ({
        ...source,
        summary: summaries?.filter((s: any) => s.source_id === source.id) || [],
        tags: tags?.filter((t: any) => t.source_id === source.id) || [],
      }))

      return NextResponse.json({
        data: enrichedData,
        total: data.length,
        page,
        limit,
        hasMore: data.length === limit,
        filters: {
          tags: filterTags,
          tagLogic,
          contentType: contentType || undefined,
          collection_id: collectionId || undefined,
        },
      })
    }

    // Use database function for collection filtering if no tags
    if (collectionId) {
      const { data, error } = await (supabase as any).rpc('get_sources_by_collection', {
        p_user_id: user.id,
        p_collection_id: collectionId,
        p_limit: limit,
        p_offset: (page - 1) * limit,
      })

      if (error) {
        throw error
      }

      // Fetch summaries and tags for each source
      const sourceIds = data.map((s: any) => s.id)
      const { data: summaries } = await (supabase as any)
        .from('summaries')
        .select('*')
        .in('source_id', sourceIds)

      const { data: tags } = await (supabase as any)
        .from('tags')
        .select('*')
        .in('source_id', sourceIds)

      // Combine data
      const enrichedData = data.map((source: any) => ({
        ...source,
        summary: summaries?.filter((s: any) => s.source_id === source.id) || [],
        tags: tags?.filter((t: any) => t.source_id === source.id) || [],
      }))

      return NextResponse.json({
        data: enrichedData,
        total: data.length,
        page,
        limit,
        hasMore: data.length === limit,
        filters: {
          collection_id: collectionId,
        },
      })
    }

    // Standard query without filtering
    let query = (supabase as any)
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

    // Apply content type filter
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
      hasMore: (count || 0) > page * limit,
      filters: {
        contentType: contentType || undefined,
      },
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
      content_type,
      original_content,
      url,
      summary_text,
      key_actions,
      key_topics,
      word_count,
    } = validation.data

    // Generate title if not provided
    let title = validation.data.title
    if (!title || title.trim() === '' || title === 'Untitled') {
      try {
        title = await generateTitle(original_content, content_type)
      } catch (error) {
        console.error('Title generation error:', error)
        title = `Untitled ${content_type.charAt(0).toUpperCase() + content_type.slice(1)}`
      }
    }

    // Create source
    const { data: source, error: sourceError } = await (supabase as any)
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

    // Generate embedding for summary (MANDATORY)
    const textToEmbed = [summary_text, ...key_topics].join(' ');
    const embeddingResult = await generateEmbedding({
      text: textToEmbed,
      type: 'summary',
      normalize: true,
    });
    const embedding = embeddingResult.embedding;

    // Create summary
    const { data: summary, error: summaryError } = await (supabase as any)
      .from('summaries')
      .insert({
        source_id: (source as any).id,
        summary_text,
        key_actions,
        key_topics,
        word_count,
        embedding,
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

      const { error: tagsError } = await (supabase as any)
        .from('tags')
        .insert(tagsData as any)

      if (tagsError) {
        console.error('Tags creation error:', tagsError)
        // Don't fail the request if tags fail
      }
    }

    // Run backfill for this user to catch any failed embeddings (non-blocking)
    backfillEmbeddings({
      user_id: user.id,
      batch_size: 10,
      skipExisting: true,
    }).catch(error => {
      console.error('Background backfill error (non-critical):', error)
    })

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
