import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

// GET: Get recommendations for a source
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sourceId = searchParams.get('source_id')
    const limit = parseInt(searchParams.get('limit') || '5')

    if (!sourceId) {
      return NextResponse.json({ error: 'source_id required' }, { status: 400 })
    }

    // Get source with embedding
    const { data: source } = await (supabase as any)
      .from('sources')
      .select(`
        id,
        summaries (embedding)
      `)
      .eq('id', sourceId)
      .eq('user_id', user.id)
      .single()

    if (!source || !source.summaries?.[0]?.embedding) {
      return NextResponse.json({ error: 'Source not found or no embedding' }, { status: 404 })
    }

    const embedding = source.summaries[0].embedding

    // Find similar sources using vector similarity
    const { data: similar, error } = await (supabase as any).rpc('match_sources', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit + 1, // +1 to exclude self
      p_user_id: user.id,
    })

    if (error) {
      console.error('Recommendation error:', error)
      return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 })
    }

    // Filter out the source itself
    const recommendations = (similar || []).filter((s: any) => s.id !== sourceId).slice(0, limit)

    return NextResponse.json({
      recommendations,
      total: recommendations.length,
    })
  } catch (error) {
    console.error('GET recommendations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
