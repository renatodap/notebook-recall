import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Fetch sources
    const { data: sources } = await (supabase as any)
      .from('sources')
      .select('id, title, content_type')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Fetch connections between these sources
    const sourceIds = sources?.map((s: any) => s.id) || []
    const { data: connections } = await (supabase as any)
      .from('source_connections')
      .select('source_a_id, source_b_id, connection_type, strength')
      .in('source_a_id', sourceIds)
      .in('source_b_id', sourceIds)

    // Fetch top concepts
    const { data: concepts } = await (supabase as any)
      .from('concepts')
      .select('id, name, frequency')
      .order('frequency', { ascending: false })
      .limit(20)

    // Fetch concept-source links
    const conceptIds = concepts?.map((c: any) => c.id) || []
    const { data: conceptLinks } = await (supabase as any)
      .from('source_concepts')
      .select('source_id, concept_id, relevance')
      .in('source_id', sourceIds)
      .in('concept_id', conceptIds)
      .gte('relevance', 0.5)

    // Fetch collections
    const { data: collections } = await (supabase as any)
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
