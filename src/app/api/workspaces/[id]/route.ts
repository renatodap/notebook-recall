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

    const { data: workspace } = await (supabase as any)
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const { data: membership } = await (supabase as any)
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', id)
      .eq('user_id', user.id)
      .single()

    if (!membership && workspace.owner_id !== user.id) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 })
    }

    const { data: members } = await (supabase as any)
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', id)

    return NextResponse.json({ workspace, members })
  } catch (error) {
    console.error('Get workspace error:', error)
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
    const { name, description } = body

    const updates: any = { updated_at: new Date().toISOString() }
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description

    const { data: workspace, error } = await (supabase as any)
      .from('workspaces')
      .update(updates)
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .single()

    if (error) throw error

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ workspace })
  } catch (error) {
    console.error('Update workspace error:', error)
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
      .from('workspaces')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete workspace error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
