import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

/**
 * Feature 27: Collaborative Collections
 * Share collections with other users for collaborative research
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { user_ids, permission_level = 'view' } = body

    if (!user_ids || user_ids.length === 0) {
      return NextResponse.json({ error: 'user_ids required' }, { status: 400 })
    }

    // Verify ownership
    const { data: collection } = await (supabase as any)
      .from('collections')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    // Add collaborators
    const collaborators = user_ids.map((uid: string) => ({
      collection_id: id,
      user_id: uid,
      permission_level,
      invited_by: user.id
    }))

    const { data, error } = await (supabase as any)
      .from('collection_collaborators')
      .insert(collaborators)
      .select()

    if (error) throw error

    return NextResponse.json({ collaborators: data }, { status: 201 })
  } catch (error) {
    console.error('Add collaborators error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get collaborators for this collection
    const { data: collaborators, error } = await (supabase as any)
      .from('collection_collaborators')
      .select('*')
      .eq('collection_id', id)

    if (error) throw error

    return NextResponse.json({ collaborators })
  } catch (error) {
    console.error('Get collaborators error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
