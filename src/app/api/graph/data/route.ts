import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { AuthenticationError, RateLimitError, handleAPIError } from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

/**
 * GET /api/graph/data - Get knowledge graph data
 * Query params:
 *   - limit: Number of sources to include (default: 50, max: 200)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to view graph data')
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

    // Fetch sources
    const { data: sources } = await supabase
      .from('sources')
      .select('id, title, content_type')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Fetch connections between these sources
    const sourceIds = sources?.map((s: any) => s.id) || []
    const { data: connections } = await supabase
      .from('source_connections')
      .select('source_a_id, source_b_id, connection_type, strength')
      .in('source_a_id', sourceIds)
      .in('source_b_id', sourceIds)

    // Fetch top concepts
    const { data: concepts } = await supabase
      .from('concepts')
      .select('id, name, frequency')
      .order('frequency', { ascending: false })
      .limit(20)

    // Fetch concept-source links
    const conceptIds = concepts?.map((c: any) => c.id) || []
    const { data: conceptLinks } = await supabase
      .from('source_concepts')
      .select('source_id, concept_id, relevance')
      .in('source_id', sourceIds)
      .in('concept_id', conceptIds)
      .gte('relevance', 0.5)

    // Fetch collections
    const { data: collections } = await supabase
      .from('collections')
      .select(`
        id,
        name,
        collection_sources (source_id)
      `)
      .eq('user_id', user.id)
      .limit(10)

    // Build graph nodes
    const nodes = [
      ...(sources || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        type: 'source' as const,
        size: 8,
      })),
      ...(concepts || []).map((c: any) => ({
        id: c.id,
        title: c.name,
        type: 'concept' as const,
        size: Math.min(15, 5 + c.frequency),
      })),
      ...(collections || []).map((c: any) => ({
        id: c.id,
        title: c.name,
        type: 'collection' as const,
        size: Math.min(20, 8 + (c.collection_sources?.length || 0)),
      })),
    ]

    // Build graph links
    const links = [
      // Source-to-source connections
      ...(connections || []).map((c: any) => ({
        source: c.source_a_id,
        target: c.source_b_id,
        type: 'connection' as const,
        strength: c.strength,
      })),
      // Concept-to-source links
      ...(conceptLinks || []).map((cl: any) => ({
        source: cl.source_id,
        target: cl.concept_id,
        type: 'concept' as const,
        strength: cl.relevance,
      })),
      // Collection-to-source links
      ...(collections || []).flatMap((col: any) =>
        (col.collection_sources || []).map((cs: any) => ({
          source: col.id,
          target: cs.source_id,
          type: 'collection' as const,
          strength: 0.8,
        }))
      ),
    ]

    return NextResponse.json({
      nodes,
      links,
      stats: {
        sources: sources?.length || 0,
        concepts: concepts?.length || 0,
        collections: collections?.length || 0,
        connections: links.length,
      },
    })
  } catch (error) {
    console.error('Graph data error:', error)
    return handleAPIError(error)
  }
}
