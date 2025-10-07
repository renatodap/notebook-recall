import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { discoverSimilarSources } from '@/lib/connections/discovery'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import {
  RateLimitError,
  AuthenticationError,
  NotFoundError,
  AuthorizationError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import {
  DiscoverConnectionsSchema,
  validateRequestBody,
} from '@/lib/validation'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import { DatabaseSource } from '@/types/api'

/**
 * POST /api/connections/discover - Discover AI connections between sources
 * @returns Promise<NextResponse> - Discovered connections
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to discover connections')
    }

    // Rate limiting check
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.AI_CONNECTIONS)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `You have reached your daily limit of ${RATE_LIMITS.AI_CONNECTIONS.maxRequests} connection discoveries. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    // Validate request body
    const { source_id, limit, connection_types } = await validateRequestBody(
      request,
      DiscoverConnectionsSchema
    )

    // Verify user owns this source
    const { data: source } = await supabase
      .from('sources')
      .select('id, title')
      .eq('id', source_id)
      .eq('user_id', user.id)
      .single()

    if (!source) {
      throw new NotFoundError(
        'Source not found. Please check the source ID and try again.'
      )
    }

    // Get all user's sources with embeddings
    const { data: allSources, error: sourcesError } = await supabase
      .from('sources')
      .select(`
        id,
        title,
        summaries (
          embedding,
          summary_text
        )
      `)
      .eq('user_id', user.id)

    if (sourcesError) {
      console.error('Fetch sources error:', sourcesError)
      throw new NotFoundError('Failed to fetch your sources. Please try again.')
    }

    // Discover similar sources
    const typesToFind = connection_types || ['similar']
    const discoveries: unknown[] = []

    if (typesToFind.includes('similar')) {
      const similarSources = await discoverSimilarSources(
        source_id,
        allSources as any,
        0.7, // threshold
        limit
      )

      for (const similar of similarSources) {
        discoveries.push({
          source_b_id: similar.source_id,
          connection_type: 'similar',
          strength: similar.strength,
          evidence: similar.evidence,
        })
      }
    }

    // Check if connections already exist
    const newConnectionIds = discoveries.map((d: any) => d.source_b_id)
    const { data: existingConnections } = await supabase
      .from('source_connections')
      .select('source_b_id, connection_type')
      .eq('source_a_id', source_id)
      .in('source_b_id', newConnectionIds)

    const existingSet = new Set(
      existingConnections?.map((c: any) => `${c.source_b_id}:${c.connection_type}`) || []
    )

    // Filter out existing connections
    const newDiscoveries = discoveries.filter(
      (d: any) => !existingSet.has(`${d.source_b_id}:${d.connection_type}`)
    )

    // Save new connections to database
    if (newDiscoveries.length > 0) {
      const connectionsToInsert = newDiscoveries.map((d: any) => ({
        source_a_id: source_id,
        source_b_id: d.source_b_id,
        connection_type: d.connection_type,
        strength: d.strength,
        evidence: d.evidence,
        auto_generated: true,
      }))

      const { error: insertError } = await supabase
        .from('source_connections')
        .insert(connectionsToInsert as never)

      if (insertError) {
        console.error('Insert connections error:', insertError)
        // Continue anyway, return discoveries
      }
    }

    // Fetch full connection data with source details
    const { data: connections, error: connError } = await supabase
      .from('source_connections')
      .select(`
        *,
        source_b:sources!source_connections_source_b_id_fkey (
          id,
          title,
          content_type,
          created_at
        )
      `)
      .eq('source_a_id', source_id)
      .order('strength', { ascending: false })
      .limit(limit)

    if (connError) {
      console.error('Fetch connections error:', connError)
      throw new NotFoundError('Failed to fetch connections. Please try again.')
    }

    return NextResponse.json({
      connections: connections || [],
      discovered_new: newDiscoveries.length,
      total: connections?.length || 0,
    }, {
      headers: {
        'X-RateLimit-Limit': RATE_LIMITS.AI_CONNECTIONS.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
      }
    })
  } catch (error) {
    console.error('Connection discovery error:', error)
    return handleAPIError(error)
  }
}
