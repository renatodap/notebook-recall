import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { AddToCollectionRequest } from '@/types'

// POST: Add source to collection
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: collectionId } = await params
    const body: Omit<AddToCollectionRequest, 'collection_id'> & { source_id: string } = await request.json()
    const { source_id, note } = body

    if (!source_id) {
      return NextResponse.json({ error: 'source_id required' }, { status: 400 })
    }

    // Verify collection ownership
    const { data: collection } = await (supabase as any)
      .from('collections')
      .select('user_id')
      .eq('id', collectionId)
      .single()

    if (!collection || collection.user_id !== user.id) {
      return NextResponse.json({ error: 'Collection not found or access denied' }, { status: 404 })
    }

    // Verify source ownership
    const { data: source } = await (supabase as any)
      .from('sources')
      .select('id')
      .eq('id', source_id)
      .eq('user_id', user.id)
      .single()

    if (!source) {
      return NextResponse.json({ error: 'Source not found or access denied' }, { status: 404 })
    }

    // Check if already in collection
    const { data: existing } = await (supabase as any)
      .from('collection_sources')
      .select('*')
      .eq('collection_id', collectionId)
      .eq('source_id', source_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Source already in collection' }, { status: 409 })
    }

    // Add to collection
    const { data: link, error } = await (supabase as any)
      .from('collection_sources')
      .insert({
        collection_id: collectionId,
        source_id,
        added_by: user.id,
        note: note || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Add source error:', error)
      return NextResponse.json({ error: 'Failed to add source' }, { status: 500 })
    }

    return NextResponse.json({ link }, { status: 201 })
  } catch (error) {
    console.error('POST collection source error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Remove source from collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: collectionId } = await params
    const { searchParams } = new URL(request.url)
    const sourceId = searchParams.get('source_id')

    if (!sourceId) {
      return NextResponse.json({ error: 'source_id query parameter required' }, { status: 400 })
    }

    // Verify collection ownership
    const { data: collection } = await (supabase as any)
      .from('collections')
      .select('user_id')
      .eq('id', collectionId)
      .single()

    if (!collection || collection.user_id !== user.id) {
      return NextResponse.json({ error: 'Collection not found or access denied' }, { status: 404 })
    }

    // Remove from collection
    const { error } = await (supabase as any)
      .from('collection_sources')
      .delete()
      .eq('collection_id', collectionId)
      .eq('source_id', sourceId)

    if (error) {
      console.error('Remove source error:', error)
      return NextResponse.json({ error: 'Failed to remove source' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE collection source error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
