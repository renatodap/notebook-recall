import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import {
  AuthenticationError,
  ValidationError,
  RateLimitError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

/**
 * Feature 26: Follow Researchers
 * Follow other users to see their public sources and activity
 */

/**
 * POST /api/social/follow - Follow a user
 * Body: { user_id_to_follow: string }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to follow users')
    }

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.DATA_MODIFICATION)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const body = await request.json()
    const { user_id_to_follow } = body

    if (!user_id_to_follow) {
      throw new ValidationError('user_id_to_follow is required')
    }

    if (user_id_to_follow === user.id) {
      throw new ValidationError('You cannot follow yourself')
    }

    // Create follow relationship
    const { data: follow, error } = await supabase
      .from('user_follows')
      .insert({
        follower_id: user.id,
        following_id: user_id_to_follow
      } as never)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ValidationError('You are already following this user')
      }
      console.error('Follow user error:', error)
      throw new Error('Failed to follow user')
    }

    return NextResponse.json({ follow }, { status: 201 })
  } catch (error) {
    console.error('Follow user error:', error)
    return handleAPIError(error)
  }
}

/**
 * DELETE /api/social/follow - Unfollow a user
 * Query params: user_id
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to unfollow users')
    }

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
      throw new ValidationError('user_id is required')
    }

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', userId)

    if (error) {
      console.error('Unfollow user error:', error)
      throw new Error('Failed to unfollow user')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unfollow user error:', error)
    return handleAPIError(error)
  }
}

/**
 * GET /api/social/follow - Get following/followers list
 * Query params: type ('following' | 'followers')
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to view follows')
    }

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SEARCH)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'following'

    if (type === 'following') {
      // Get users I'm following
      const { data: following, error } = await supabase
        .from('user_follows')
        .select('following_id, created_at')
        .eq('follower_id', user.id)

      if (error) {
        console.error('Fetch following error:', error)
        throw new Error('Failed to fetch following list')
      }
      return NextResponse.json({ following: following || [] })
    } else if (type === 'followers') {
      // Get my followers
      const { data: followers, error } = await supabase
        .from('user_follows')
        .select('follower_id, created_at')
        .eq('following_id', user.id)

      if (error) {
        console.error('Fetch followers error:', error)
        throw new Error('Failed to fetch followers list')
      }
      return NextResponse.json({ followers: followers || [] })
    }

    return NextResponse.json({ users: [] })
  } catch (error) {
    console.error('Get follows error:', error)
    return handleAPIError(error)
  }
}
