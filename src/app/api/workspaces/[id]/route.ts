import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { ResourceIdParamSchema, UpdateWorkspaceSchema } from '@/lib/validation/schemas'
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'

// GET: Get workspace details with members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

    const resolvedParams = await params
    const validation = ResourceIdParamSchema.safeParse(resolvedParams)
    if (!validation.success) {
      throw new ValidationError('Invalid workspace ID format')
    }

    const { id } = validation.data

    // Fetch workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .single()

    if (!workspace) {
      throw new NotFoundError('Workspace not found')
    }

    // Check membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', id)
      .eq('user_id', user.id)
      .single()

    if (!membership && (workspace as any).owner_id !== user.id) {
      throw new AuthorizationError('You are not a member of this workspace')
    }

    // Fetch members
    const { data: members } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', id)

    return NextResponse.json({ workspace, members })
  } catch (error) {
    console.error('Get workspace error:', error)
    return handleAPIError(error)
  }
}

// PATCH: Update workspace
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to update workspaces')
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

    const resolvedParams = await params
    const validation = ResourceIdParamSchema.safeParse(resolvedParams)
    if (!validation.success) {
      throw new ValidationError('Invalid workspace ID format')
    }

    const { id } = validation.data

    // Validate request body
    const body = await request.json()
    const bodyValidation = UpdateWorkspaceSchema.safeParse(body)
    if (!bodyValidation.success) {
      throw new ValidationError(bodyValidation.error.issues[0].message)
    }

    const validatedData = bodyValidation.data

    // Build updates
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }
    if (validatedData.name !== undefined) updates.name = validatedData.name
    if (validatedData.description !== undefined) updates.description = validatedData.description
    if (validatedData.is_public !== undefined) updates.is_public = validatedData.is_public
    if (validatedData.settings !== undefined) updates.settings = validatedData.settings

    // Update only if user is owner
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .update(updates as never)
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Update workspace error:', error)
      throw new Error('Failed to update workspace')
    }

    if (!workspace) {
      throw new NotFoundError('Workspace not found or you do not have permission to update it')
    }

    return NextResponse.json({ workspace })
  } catch (error) {
    console.error('Update workspace error:', error)
    return handleAPIError(error)
  }
}

// DELETE: Delete workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to delete workspaces')
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

    const resolvedParams = await params
    const validation = ResourceIdParamSchema.safeParse(resolvedParams)
    if (!validation.success) {
      throw new ValidationError('Invalid workspace ID format')
    }

    const { id } = validation.data

    // Delete only if user is owner
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id)

    if (error) {
      console.error('Delete workspace error:', error)
      throw new Error('Failed to delete workspace')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete workspace error:', error)
    return handleAPIError(error)
  }
}
