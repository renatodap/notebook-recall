import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { CreateWorkspaceSchema } from '@/lib/validation/schemas'
import {
  AuthenticationError,
  ValidationError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'

/**
 * Feature 29: Team Workspaces
 * Create shared workspaces for team research projects
 */

// POST: Create a new workspace
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to create workspaces')
    }

    const { checkRateLimit, RATE_LIMITS } = await import('@/lib/rate-limiter')
    const { RateLimitError } = await import('@/lib/errors/custom-errors')
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.DATA_MODIFICATION)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    // Validate request body
    const body = await request.json()
    const validation = CreateWorkspaceSchema.safeParse(body)
    if (!validation.success) {
      throw new ValidationError(validation.error.issues[0].message)
    }

    const validatedData = validation.data

    // Create workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        name: validatedData.name,
        description: validatedData.description || '',
        is_public: validatedData.is_public || false,
        settings: validatedData.settings,
        owner_id: user.id
      } as never)
      .select()
      .single()

    if (workspaceError || !workspace) {
      console.error('Create workspace error:', workspaceError)
      throw new Error('Failed to create workspace')
    }

    const createdWorkspace = workspace as unknown as { id: string; [key: string]: unknown }

    // Add owner as admin member
    const members = [{
      workspace_id: createdWorkspace.id,
      user_id: user.id,
      role: 'admin'
    }]

    // Add additional members if provided (from body.member_ids - not in schema, but may be in body)
    const memberIds = (body as { member_ids?: string[] }).member_ids
    if (memberIds && Array.isArray(memberIds)) {
      members.push(...memberIds.map((uid: string) => ({
        workspace_id: createdWorkspace.id,
        user_id: uid,
        role: 'member'
      })))
    }

    const { error: membersError } = await supabase
      .from('workspace_members')
      .insert(members as never)

    if (membersError) {
      console.error('Add workspace members error:', membersError)
      throw new Error('Failed to add workspace members')
    }

    return NextResponse.json({ workspace: createdWorkspace }, { status: 201 })
  } catch (error) {
    console.error('Create workspace error:', error)
    return handleAPIError(error)
  }
}

// GET: List all workspaces for current user
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to view workspaces')
    }

    const { checkRateLimit, RATE_LIMITS } = await import('@/lib/rate-limiter')
    const { RateLimitError } = await import('@/lib/errors/custom-errors')
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SEARCH)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    // Get workspaces where user is a member
    const { data: memberships, error } = await supabase
      .from('workspace_members')
      .select('workspace_id, role, workspaces (*)')
      .eq('user_id', user.id)

    if (error) {
      console.error('Get workspaces error:', error)
      throw new Error('Failed to fetch workspaces')
    }

    const workspaces = memberships?.map((m: any) => ({
      ...m.workspaces,
      my_role: m.role
    })) || []

    return NextResponse.json({ workspaces })
  } catch (error) {
    console.error('Get workspaces error:', error)
    return handleAPIError(error)
  }
}
