import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/embeddings/client'
import { backfillEmbeddings } from '@/lib/embeddings/backfill'
import { generateTitle } from '@/lib/claude/client'
import {
  createSourceSchema,
  GetSourcesQuerySchema,
  validateRequestBody,
  validateQueryParams,
} from '@/lib/validation'
import {
  ValidationError,
  AuthenticationError,
  DatabaseError,
  RateLimitError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import { DatabaseSource } from '@/types/api'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

/**
 * GET /api/sources - List all sources for the authenticated user
 * @returns Promise<NextResponse> - Paginated list of sources with summaries and tags
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to view your sources')
    }

    // Rate limiting - SEARCH limit for GET
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SEARCH)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    // Validate and parse query parameters
    const {
      page,
      limit,
      contentType,
      sort: sortBy,
      tags: tagsParam,
      tagLogic,
      collection_id: collectionId,
    } = validateQueryParams(request, GetSourcesQuerySchema)

    // Parse tag filter
    const filterTags = tagsParam
      ? tagsParam.split(',').map((t) => t.trim().toLowerCase())
      : []

    // Use database function for tag filtering if tags are specified
    if (filterTags.length > 0) {
      const { data, error } = await supabase.rpc('get_sources_by_tags', {
        p_user_id: user.id,
        p_tags: filterTags,
        p_tag_logic: tagLogic,
        p_content_type: contentType || null,
        p_collection_id: collectionId || null,
        p_limit: limit,
        p_offset: (page - 1) * limit,
      } as never)

      if (error) {
        throw error
      }

      // Fetch summaries and tags for each source
      const sourceIds = Array.isArray(data) ? (data as any[]).map((s: any) => s.id) : []
      const { data: summaries } = await supabase
        .from('summaries')
        .select('*')
        .in('source_id', sourceIds)

      const { data: tags } = await supabase
        .from('tags')
        .select('*')
        .in('source_id', sourceIds)

      // Combine data
      const enrichedData = Array.isArray(data) ? (data as any[]).map((source: any) => ({
        ...source,
        summary: summaries?.filter((s: any) => s.source_id === source.id) || [],
        tags: tags?.filter((t: any) => t.source_id === source.id) || [],
      })) : []

      return NextResponse.json({
        data: enrichedData,
        total: Array.isArray(data) ? (data as any[]).length : 0,
        page,
        limit,
        hasMore: Array.isArray(data) && (data as any[]).length === limit,
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
      const { data, error } = await supabase.rpc('get_sources_by_collection', {
        p_user_id: user.id,
        p_collection_id: collectionId,
        p_limit: limit,
        p_offset: (page - 1) * limit,
      } as never)

      if (error) {
        throw error
      }

      // Fetch summaries and tags for each source
      const sourceIds = Array.isArray(data) ? (data as any[]).map((s: any) => s.id) : []
      const { data: summaries } = await supabase
        .from('summaries')
        .select('*')
        .in('source_id', sourceIds)

      const { data: tags } = await supabase
        .from('tags')
        .select('*')
        .in('source_id', sourceIds)

      // Combine data
      const enrichedData = Array.isArray(data) ? (data as any[]).map((source: any) => ({
        ...source,
        summary: summaries?.filter((s: any) => s.source_id === source.id) || [],
        tags: tags?.filter((t: any) => t.source_id === source.id) || [],
      })) : []

      return NextResponse.json({
        data: enrichedData,
        total: Array.isArray(data) ? (data as any[]).length : 0,
        page,
        limit,
        hasMore: Array.isArray(data) && (data as any[]).length === limit,
        filters: {
          collection_id: collectionId,
        },
      })
    }

    // Standard query without filtering
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

    // Apply content type filter
    if (contentType) {
      query = query.eq('content_type' as never, contentType)
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
    return handleAPIError(error)
  }
}

/**
 * POST /api/sources - Create a new source with summary
 * @returns Promise<NextResponse> - Created source with summary and embedding
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to create sources')
    }

    // Rate limiting - SOURCE_CREATION limit for POST
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SOURCE_CREATION)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many source creations. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    // Validate request body
    const {
      title: providedTitle,
      content_type,
      original_content,
      url,
      summary_text,
      key_actions,
      key_topics,
      word_count,
    } = await validateRequestBody(request, createSourceSchema)

    // Generate title if not provided
    let title = providedTitle
    if (!title || title.trim() === '' || title === 'Untitled') {
      try {
        title = await generateTitle(original_content, content_type)
      } catch (error) {
        console.error('Title generation error:', error)
        title = `Untitled ${content_type.charAt(0).toUpperCase() + content_type.slice(1)}`
      }
    }

    // Create source
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .insert({
        user_id: user.id,
        title,
        content_type,
        original_content,
        url,
      } as never)
      .select()
      .single()

    if (sourceError || !source) {
      console.error('Source creation error:', {
        error: sourceError,
        message: sourceError?.message,
        details: sourceError?.details,
        hint: sourceError?.hint,
        code: sourceError?.code,
      })
      throw new DatabaseError(
        'Failed to save source. Please try again.'
      )
    }

    const createdSource = source as unknown as { id: string; [key: string]: unknown }

    // Generate embedding for summary (MANDATORY)
    const textToEmbed = [summary_text, ...key_topics].join(' ');
    console.log(`[Embeddings] Generating embedding for source "${title}"...`);

    const embeddingResult = await generateEmbedding({
      text: textToEmbed,
      type: 'summary',
      normalize: true,
    });
    const embedding = embeddingResult.embedding;

    // Log embedding generation success
    console.log(`[Embeddings] ✅ Generated embedding:`, {
      provider: embeddingResult.provider || 'unknown',
      model: embeddingResult.model,
      dimension: embedding.length,
      cost: embeddingResult.cost || 0,
      latency_ms: embeddingResult.latency_ms,
      fallback_used: embeddingResult.fallbackUsed,
    });

    // Create summary
    const { data: summary, error: summaryError } = await supabase
      .from('summaries')
      .insert({
        source_id: createdSource.id,
        summary_text,
        key_actions,
        key_topics,
        word_count,
        embedding,
      } as never)
      .select()
      .single()

    if (summaryError) {
      console.error('[Embeddings] ❌ Summary creation error:', {
        error: summaryError,
        message: summaryError?.message,
        details: summaryError?.details,
        hint: summaryError?.hint,
        code: summaryError?.code,
      })
      throw new DatabaseError('Failed to save summary. Please try again.')
    }

    // Verify embedding was saved
    const savedSummary = summary as any;
    if (!savedSummary.embedding) {
      console.error('[Embeddings] ⚠️ WARNING: Summary created but embedding was NOT saved!');
    } else {
      console.log('[Embeddings] ✅ Embedding saved successfully to database');
    }

    // Create tags
    if (key_topics.length > 0) {
      const tagsData = key_topics.map((topic) => ({
        source_id: createdSource.id,
        tag_name: topic.toLowerCase(),
      }))

      const { error: tagsError } = await supabase
        .from('tags')
        .insert(tagsData as never)

      if (tagsError) {
        console.error('Tags creation error:', tagsError)
        // Don't fail the request if tags fail
      }
    }

    // Run backfill for this user to catch any failed embeddings (non-blocking)
    backfillEmbeddings({
      batchSize: 10,
    }).catch(error => {
      console.error('Background backfill error (non-critical):', error)
    })

    return NextResponse.json({
      source,
      summary,
    }, { status: 201 })
  } catch (error) {
    console.error('POST sources error:', error)
    return handleAPIError(error)
  }
}
