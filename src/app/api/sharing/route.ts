import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

/**
 * Feature 25: Public/Private Source Sharing
 * Share sources publicly or with specific users
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { source_id, visibility = 'private', shared_with_user_ids = [] } = body

    if (!source_id) {
      return NextResponse.json({ error: 'source_id required' }, { status: 400 })
    }

    // Verify ownership
    const { data: source } = await (supabase as any)
      .from('sources')
      .select('id')
      .eq('id', source_id)
      .eq('user_id', user.id)
      .single()

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    // Create or update share
    const { data: share, error } = await (supabase as any)
      .from('source_shares')
      .upsert({
        source_id,
        owner_id: user.id,
        visibility,
        shared_with_user_ids: visibility === 'specific' ? shared_with_user_ids : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'source_id'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ share }, { status: 201 })
  } catch (error) {
    console.error('Share source error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'owned'

    if (type === 'owned') {
      // Get shares I created
      const { data: shares, error } = await (supabase as any)
        .from('source_shares')
        .select('*, sources (id, title, created_at)')
        .eq('owner_id', user.id)

      if (error) throw error
      return NextResponse.json({ shares })
    } else if (type === 'shared_with_me') {
      // Get public shares + shares specifically with me
      const { data: publicShares } = await (supabase as any)
        .from('source_shares')
        .select('*, sources (id, title, created_at)')
        .eq('visibility', 'public')
        .neq('owner_id', user.id)

      const { data: specificShares } = await (supabase as any)
        .from('source_shares')
        .select('*, sources (id, title, created_at)')
        .contains('shared_with_user_ids', [user.id])

      const shares = [...(publicShares || []), ...(specificShares || [])]
      return NextResponse.json({ shares })
    }

    return NextResponse.json({ shares: [] })
  } catch (error) {
    console.error('Get shares error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
