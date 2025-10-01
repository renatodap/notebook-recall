import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { discoverSimilarSources, scoreConnectionStrength, generateConnectionEvidence } from '@/lib/connections/discovery'
import type { DiscoverConnectionsRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: DiscoverConnectionsRequest = await request.json()
    const { source_id, limit = 10, connection_types } = body

    if (!source_id) {
      return NextResponse.json({ error: 'source_id required' }, { status: 400 })
    }

    // Verify user owns this source
    const { data: source } = await supabase
      .from('sources')
      .select('id, title')
      .eq('id', source_id)
      .eq('user_id', user.id)
      .single()

    if (!source) {
      return NextResponse.json(
        { error: 'Source not found or access denied' },
        { status: 404 }
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
      return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 })
    }

    // Discover similar sources
    const typesToFind = connection_types || ['similar']
    const discoveries: any[] = []

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
    const newConnectionIds = discoveries.map(d => d.source_b_id)
    const { data: existingConnections } = await (supabase as any)
      .from('source_connections')
      .select('source_b_id, connection_type')
      .eq('source_a_id', source_id)
      .in('source_b_id', newConnectionIds)

    const existingSet = new Set(
      existingConnections?.map((c: any) => `${c.source_b_id}:${c.connection_type}`) || []
    )

    // Filter out existing connections
    const newDiscoveries = discoveries.filter(
      (d) => !existingSet.has(`${d.source_b_id}:${d.connection_type}`)
    )

    // Save new connections to database
    if (newDiscoveries.length > 0) {
      const connectionsToInsert = newDiscoveries.map((d) => ({
        source_a_id: source_id,
        source_b_id: d.source_b_id,
        connection_type: d.connection_type,
        strength: d.strength,
        evidence: d.evidence,
        auto_generated: true,
      }))

      const { error: insertError } = await (supabase as any)
        .from('source_connections')
        .insert(connectionsToInsert)

      if (insertError) {
        console.error('Insert connections error:', insertError)
        // Continue anyway, return discoveries
      }
    }

    // Fetch full connection data with source details
    const { data: connections, error: connError } = await (supabase as any)
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
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 })
    }

    return NextResponse.json({
      connections: connections || [],
      discovered_new: newDiscoveries.length,
      total: connections?.length || 0,
    })
  } catch (error) {
    console.error('Connection discovery error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
