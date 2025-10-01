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
    const sourceId = searchParams.get('source_id')

    let query = (supabase as any)
      .from('pdf_annotations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (sourceId) {
      query = query.eq('source_id', sourceId)
    }

    const { data: annotations, error } = await query

    if (error) throw error

    return NextResponse.json({ annotations })
  } catch (error) {
    console.error('Get annotations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { source_id, page_number, annotation_type, selected_text, note, color, position } = body

    if (!source_id || page_number === undefined) {
      return NextResponse.json({ error: 'source_id and page_number required' }, { status: 400 })
    }

    // Verify user owns the source
    const { data: source } = await (supabase as any)
      .from('sources')
      .select('id')
      .eq('id', source_id)
      .eq('user_id', user.id)
      .single()

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    const { data: annotation, error } = await (supabase as any)
      .from('pdf_annotations')
      .insert({
        user_id: user.id,
        source_id,
        page_number,
        annotation_type: annotation_type || 'highlight',
        selected_text: selected_text || '',
        note: note || '',
        color: color || '#FFFF00',
        position: position || {}
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ annotation }, { status: 201 })
  } catch (error) {
    console.error('Create annotation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
