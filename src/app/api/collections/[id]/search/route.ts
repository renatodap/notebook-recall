import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { validateRequestBody, validatePathParams } from '@/lib/validation/middleware'
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  RateLimitError,
  ValidationError,
  handleAPIError
} from '@/lib/errors/custom-errors'
import { z } from 'zod'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { authenticateRequest } from '@/lib/api-auth'

const PathParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid collection ID format' }),
})

const SearchRequestSchema = z.object({
  query: z.string().min(1, 'Query must not be empty'),
  max_results: z.number().int().min(1).max(100).optional().default(10),
})

/**
 * POST /api/collections/[id]/search - Semantic search within collection
 * Supports both session auth and API key auth
 * @param params.id - Collection UUID
 * @body { query: string, max_results?: number }
 * @returns Array of relevant content chunks with scores
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Support API key auth
    const { userId } = await authenticateRequest(request)

    // Rate limiting - SEARCH limit for semantic search
    const rateLimit = await checkRateLimit(userId, RATE_LIMITS.SEARCH)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const supabase = await createRouteHandlerClient()

    const resolvedParams = await params
    const { id: collectionId } = validatePathParams(resolvedParams, PathParamsSchema)

    // Validate request body
    const { query, max_results } = await validateRequestBody(request, SearchRequestSchema)

    // Verify collection exists and user has access
    const { data: collection, error: collectionError } = await (supabase as any)
      .from('collections')
      .select('user_id, is_public')
      .eq('id', collectionId)
      .single()

    if (collectionError || !collection) {
      throw new NotFoundError('Collection not found')
    }

    // Check access - user must own collection or it must be public
    if (collection.user_id !== userId && !collection.is_public) {
      throw new AuthorizationError('You do not have permission to search this collection')
    }

    // Get all sources in the collection
    const { data: collectionSources, error: sourcesError } = await (supabase as any)
      .from('collection_sources')
      .select('source_id')
      .eq('collection_id', collectionId)

    if (sourcesError) {
      console.error('Fetch collection sources error:', sourcesError)
      throw new DatabaseError('Failed to search collection. Please try again')
    }

    if (!collectionSources || collectionSources.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    const sourceIds = collectionSources.map((cs: any) => cs.source_id)

    // Perform semantic search across all sources in collection
    // This uses the match_documents RPC function with embedding search
    const { data: searchResults, error: searchError } = await (supabase as any)
      .rpc('match_documents', {
        query_text: query,
        match_count: max_results,
        filter_source_ids: sourceIds,
      })

    if (searchError) {
      console.error('Semantic search error:', searchError)
      // Fallback: return recent summaries if semantic search fails
      const { data: fallbackResults } = await (supabase as any)
        .from('summaries')
        .select(`
          id,
          summary_text,
          source_id,
          sources (
            id,
            title,
            content_type
          )
        `)
        .in('source_id', sourceIds)
        .order('created_at', { ascending: false })
        .limit(max_results)

      const transformedFallback = fallbackResults?.map((result: any) => ({
        id: result.id,
        content: result.summary_text,
        content_type: 'summary',
        source_id: result.source_id,
        source_title: result.sources?.title,
        relevance_score: 0.5, // Default score for fallback
      })) || []

      return NextResponse.json({
        success: true,
        data: transformedFallback,
        note: 'Semantic search unavailable, showing recent summaries',
      })
    }

    // Transform search results to expected format
    const transformedResults = searchResults?.map((result: any) => ({
      id: result.id,
      content: result.content || result.summary_text,
      content_type: result.content_type || 'summary',
      source_id: result.source_id,
      source_title: result.source_title,
      relevance_score: result.similarity || 0,
    })) || []

    return NextResponse.json({
      success: true,
      data: transformedResults,
    })
  } catch (error) {
    return handleAPIError(error)
  }
}
