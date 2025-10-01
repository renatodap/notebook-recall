import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

/**
 * Feature 29: Team Workspaces
 * Create shared workspaces for team research projects
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, member_ids = [] } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'name required' }, { status: 400 })
    }

    // Create workspace
    const { data: workspace, error: workspaceError } = await (supabase as any)
      .from('workspaces')
      .insert({
        name,
        description: description || '',
        owner_id: user.id
      })
      .select()
      .single()

    if (workspaceError) throw workspaceError

    // Add owner as admin member
    const members = [
      {
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'admin'
      },
      ...member_ids.map((uid: string) => ({
        workspace_id: workspace.id,
        user_id: uid,
        role: 'member'
      }))
    ]

    const { error: membersError } = await (supabase as any)
      .from('workspace_members')
      .insert(members)

    if (membersError) throw membersError

    return NextResponse.json({ workspace }, { status: 201 })
  } catch (error) {
    console.error('Create workspace error:', error)
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

    // Get workspaces where user is a member
    const { data: memberships, error } = await (supabase as any)
      .from('workspace_members')
      .select('workspace_id, role, workspaces (*)')
      .eq('user_id', user.id)

    if (error) throw error

    const workspaces = memberships?.map((m: any) => ({
      ...m.workspaces,
      my_role: m.role
    })) || []

    return NextResponse.json({ workspaces })
  } catch (error) {
    console.error('Get workspaces error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
