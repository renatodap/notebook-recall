import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

// GET: Get collection details
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

    const { id: collectionId } = await params

    // Fetch collection with sources
    const { data: collection, error } = await (supabase as any)
      .from('collections')
      .select(`
        *,
        collection_sources (
          source_id,
          note,
          added_at,
          source:sources (
            id,
            title,
            content_type,
            created_at,
            summaries (summary_text),
            tags (tag_name)
          )
        )
      `)
      .eq('id', collectionId)
      .single()

    if (error) {
      console.error('Fetch collection error:', error)
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    // Check access
    if (collection.user_id !== user.id && !collection.is_public) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Transform sources
    const sources = collection.collection_sources?.map((cs: any) => ({
      ...cs.source,
      note: cs.note,
      added_at: cs.added_at,
    })) || []

    return NextResponse.json({
      collection: {
        ...collection,
        sources,
        collection_sources: undefined,
      },
    })
  } catch (error) {
    console.error('GET collection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Update collection
export async function PUT(
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
    const body = await request.json()
    const { name, description, is_public, collection_type } = body

    // Verify ownership
    const { data: collection } = await (supabase as any)
      .from('collections')
      .select('user_id')
      .eq('id', collectionId)
      .single()

    if (!collection || collection.user_id !== user.id) {
      return NextResponse.json({ error: 'Collection not found or access denied' }, { status: 404 })
    }

    // Update
    const updates: any = {}
    if (name !== undefined) updates.name = name.trim()
    if (description !== undefined) updates.description = description?.trim() || null
    if (is_public !== undefined) updates.is_public = is_public
    if (collection_type !== undefined) updates.collection_type = collection_type

    const { data: updated, error } = await (supabase as any)
      .from('collections')
      .update(updates)
      .eq('id', collectionId)
      .select()
      .single()

    if (error) {
      console.error('Update collection error:', error)
      return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 })
    }

    return NextResponse.json({ collection: updated })
  } catch (error) {
    console.error('PUT collection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete collection
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

    // Verify ownership
    const { data: collection } = await (supabase as any)
      .from('collections')
      .select('user_id')
      .eq('id', collectionId)
      .single()

    if (!collection || collection.user_id !== user.id) {
      return NextResponse.json({ error: 'Collection not found or access denied' }, { status: 404 })
    }

    // Delete (will cascade to collection_sources)
    const { error } = await (supabase as any)
      .from('collections')
      .delete()
      .eq('id', collectionId)

    if (error) {
      console.error('Delete collection error:', error)
      return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE collection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
