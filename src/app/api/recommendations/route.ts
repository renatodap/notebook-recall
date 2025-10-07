import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { DatabaseRecord } from '@/types/api-types'
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

/**
 * GET /api/recommendations - Get AI-powered recommendations for a source
 * Query params:
 *   - source_id: UUID of source to get recommendations for
 *   - limit: Number of recommendations (default: 5, max: 20)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to get recommendations')
    }

    // Rate limiting - SEARCH limit for GET
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SEARCH)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const { searchParams } = new URL(request.url)
    const sourceId = searchParams.get('source_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20)

    if (!sourceId) {
      throw new ValidationError('source_id is required')
    }

    // Get source with embedding
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .select(`
        id,
        summaries (embedding)
      `)
      .eq('id', sourceId)
      .eq('user_id', user.id)
      .single()

    if (sourceError || !source) {
      throw new NotFoundError('Source not found or you do not have permission to access it')
    }

    const summaries = (source as any).summaries
    if (!summaries || !summaries[0]?.embedding) {
      throw new NotFoundError('Source does not have an embedding. Please generate a summary first.')
    }

    const embedding = summaries[0].embedding

    // Find similar sources using vector similarity
    const { data: similar, error } = await (supabase as any).rpc('match_sources', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit + 1, // +1 to exclude self
      p_user_id: user.id,
    })

    if (error) {
      console.error('Recommendation error:', error)
      throw new Error('Failed to get recommendations')
    }

    // Filter out the source itself
    const recommendations = (similar || []).filter((s: DatabaseRecord) => s.id !== sourceId).slice(0, limit)

    return NextResponse.json({
      recommendations,
      total: recommendations.length,
    })
  } catch (error) {
    console.error('GET recommendations error:', error)
    return handleAPIError(error)
  }
}
