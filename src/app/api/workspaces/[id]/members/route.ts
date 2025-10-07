import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to add workspace members')
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

    const body = await request.json()
    const { user_id, role = 'member' } = body

    if (!user_id) {
      throw new ValidationError('user_id is required')
    }

    const { data: workspace } = await supabase
      .from('workspaces')
      .select('owner_id')
      .eq('id', id)
      .single()

    if (!workspace || (workspace as any).owner_id !== user.id) {
      throw new AuthorizationError('Only workspace owner can add members')
    }

    const { data: member, error } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: id,
        user_id,
        role
      } as never)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error('Add member error:', error)
    return handleAPIError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to remove workspace members')
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

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      throw new ValidationError('user_id query parameter is required')
    }

    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', id)
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove member error:', error)
    return handleAPIError(error)
  }
}
