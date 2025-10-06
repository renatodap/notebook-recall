import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

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

    const { data: annotation, error } = await (supabase as any)
      .from('pdf_annotations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id as never)
      .single()

    if (error) throw error

    if (!annotation) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
    }

    return NextResponse.json({ annotation })
  } catch (error) {
    console.error('Get annotation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
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
    const { note, color, annotation_type } = body

    const updateData: any = {}
    if (note !== undefined) updateData.note = note
    if (color !== undefined) updateData.color = color
    if (annotation_type !== undefined) updateData.annotation_type = annotation_type

    const { data: annotation, error } = await (supabase as any)
      .from('pdf_annotations')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id as never)
      .select()
      .single()

    if (error) throw error

    if (!annotation) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
    }

    return NextResponse.json({ annotation })
  } catch (error) {
    console.error('Update annotation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    const { error } = await (supabase as any)
      .from('pdf_annotations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id as never)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete annotation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
