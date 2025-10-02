import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sourceId } = await params

    // Verify user owns this source
    const { data: source } = await (supabase as any)
      .from('sources')
      .select('id')
      .eq('id', sourceId)
      .eq('user_id', user.id)
      .single()

    if (!source) {
      return NextResponse.json({ error: 'Source not found or access denied' }, { status: 404 })
    }

    // Fetch contradictions where this source is involved
    const { data: contradictionsA, error: errorA } = await (supabase as any)
      .from('contradictions')
      .select(`
        *,
        source_b:sources!contradictions_source_b_id_fkey (
          id,
          title,
          content_type
        )
      `)
      .eq('source_a_id', sourceId)

    const { data: contradictionsB, error: errorB } = await (supabase as any)
      .from('contradictions')
      .select(`
        *,
        source_a:sources!contradictions_source_a_id_fkey (
          id,
          title,
          content_type
        )
      `)
      .eq('source_b_id', sourceId)

    if (errorA || errorB) {
      console.error('Fetch contradictions error:', errorA || errorB)
      return NextResponse.json({ error: 'Failed to fetch contradictions' }, { status: 500 })
    }

    // Combine both directions
    const allContradictions = [
      ...(contradictionsA || []),
      ...(contradictionsB || []),
    ]

    return NextResponse.json({
      contradictions: allContradictions,
      total: allContradictions.length,
    })
  } catch (error) {
    console.error('Get contradictions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
