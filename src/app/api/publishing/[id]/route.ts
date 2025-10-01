import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

// GET: Get published output details
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

    const { id: outputId } = await params

    // Fetch output with linked sources
    const { data: output, error } = await (supabase as any)
      .from('published_outputs')
      .select(`
        *,
        output_sources (
          source:sources (
            id,
            title,
            content_type,
            created_at
          )
        )
      `)
      .eq('id', outputId)
      .single()

    if (error) {
      console.error('Fetch output error:', error)
      return NextResponse.json({ error: 'Output not found' }, { status: 404 })
    }

    // Check ownership
    if (output.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Transform sources
    const sources = output.output_sources?.map((os: any) => os.source) || []

    return NextResponse.json({
      output: {
        ...output,
        sources,
        output_sources: undefined,
      },
    })
  } catch (error) {
    console.error('GET output error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Update published output
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

    const { id: outputId } = await params
    const body = await request.json()
    const { title, content, status, metadata } = body

    // Verify ownership
    const { data: output } = await (supabase as any)
      .from('published_outputs')
      .select('user_id')
      .eq('id', outputId)
      .single()

    if (!output || output.user_id !== user.id) {
      return NextResponse.json({ error: 'Output not found or access denied' }, { status: 404 })
    }

    // Update
    const updates: any = {}
    if (title !== undefined) updates.title = title
    if (content !== undefined) updates.content = content
    if (status !== undefined) updates.status = status
    if (metadata !== undefined) updates.metadata = metadata

    const { data: updated, error } = await (supabase as any)
      .from('published_outputs')
      .update(updates)
      .eq('id', outputId)
      .select()
      .single()

    if (error) {
      console.error('Update output error:', error)
      return NextResponse.json({ error: 'Failed to update output' }, { status: 500 })
    }

    return NextResponse.json({ output: updated })
  } catch (error) {
    console.error('PUT output error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete published output
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

    const { id: outputId } = await params

    // Verify ownership
    const { data: output } = await (supabase as any)
      .from('published_outputs')
      .select('user_id')
      .eq('id', outputId)
      .single()

    if (!output || output.user_id !== user.id) {
      return NextResponse.json({ error: 'Output not found or access denied' }, { status: 404 })
    }

    // Delete (will cascade to output_sources)
    const { error } = await (supabase as any)
      .from('published_outputs')
      .delete()
      .eq('id', outputId)

    if (error) {
      console.error('Delete output error:', error)
      return NextResponse.json({ error: 'Failed to delete output' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE output error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
