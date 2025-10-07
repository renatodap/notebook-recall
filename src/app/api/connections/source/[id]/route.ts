import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

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

    // Rate limiting - SEARCH limit for GET
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SEARCH)
    if (rateLimit.isLimited) {
      return NextResponse.json(
        {
          error: `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
          retryAfter: rateLimit.retryAfter
        },
        { status: 429 }
      )
    }

    const { id: sourceId } = await params

    // Verify user owns this source
    const { data: source } = await (supabase as any)
      .from('sources')
      .select('id')
      .eq('id', sourceId)
      .eq('user_id', user.id as never)
      .single()

    if (!source) {
      return NextResponse.json(
        { error: 'Source not found or access denied' },
        { status: 404 }
      )
    }

    // Fetch connections where this source is source_a
    const { data: connectionsA, error: errorA } = await (supabase as any)
      .from('source_connections')
      .select(`
        *,
        target:sources!source_connections_source_b_id_fkey (
          id,
          title,
          content_type,
          created_at
        )
      `)
      .eq('source_a_id', sourceId)
      .order('strength', { ascending: false })

    // Fetch connections where this source is source_b
    const { data: connectionsB, error: errorB } = await (supabase as any)
      .from('source_connections')
      .select(`
        *,
        target:sources!source_connections_source_a_id_fkey (
          id,
          title,
          content_type,
          created_at
        )
      `)
      .eq('source_b_id', sourceId)
      .order('strength', { ascending: false })

    if (errorA || errorB) {
      console.error('Fetch connections error:', errorA || errorB)
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 })
    }

    // Combine and deduplicate
    const allConnections = [
      ...(connectionsA || []),
      ...(connectionsB || []),
    ]

    return NextResponse.json({
      connections: allConnections,
      total: allConnections.length,
    })
  } catch (error) {
    console.error('Get connections error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
