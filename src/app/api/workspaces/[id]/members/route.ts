import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

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
    const { user_id, role = 'member' } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    const { data: workspace } = await (supabase as any)
      .from('workspaces')
      .select('owner_id')
      .eq('id', id)
      .single()

    if (!workspace || workspace.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only workspace owner can add members' }, { status: 403 })
    }

    const { data: member, error } = await (supabase as any)
      .from('workspace_members')
      .insert({
        workspace_id: id,
        user_id,
        role
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error('Add member error:', error)
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

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    const { error } = await (supabase as any)
      .from('workspace_members')
      .delete()
      .eq('workspace_id', id)
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
