import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { CreateCollectionRequest } from '@/types'

// GET: List all collections for current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: collections, error } = await (supabase as any)
      .from('collections')
      .select(`
        *,
        sources:collection_sources(count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch collections error:', error)
      return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 })
    }

    // Transform to include source count
    const collectionsWithCount = collections?.map((c: any) => ({
      ...c,
      source_count: c.sources?.[0]?.count || 0,
      sources: undefined,
    })) || []

    return NextResponse.json({
      collections: collectionsWithCount,
      total: collectionsWithCount.length,
    })
  } catch (error) {
    console.error('GET collections error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create new collection
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateCollectionRequest = await request.json()
    const { name, description, is_public, collection_type, source_ids } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'name required' }, { status: 400 })
    }

    // Create collection
    const { data: collection, error: createError } = await (supabase as any)
      .from('collections')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        is_public: is_public || false,
        collection_type: collection_type || 'project',
      })
      .select()
      .single()

    if (createError) {
      console.error('Create collection error:', createError)
      return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 })
    }

    // Add sources if provided
    if (source_ids && source_ids.length > 0) {
      const sourceLinks = source_ids.map(sid => ({
        collection_id: collection.id,
        source_id: sid,
        added_by: user.id,
      }))

      const { error: linkError } = await (supabase as any)
        .from('collection_sources')
        .insert(sourceLinks)

      if (linkError) {
        console.error('Link sources error:', linkError)
        // Continue anyway, collection is created
      }
    }

    return NextResponse.json({ collection }, { status: 201 })
  } catch (error) {
    console.error('POST collection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
