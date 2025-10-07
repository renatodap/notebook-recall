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
 * Feature 28: Social Features (Likes, Comments)
 * Like and comment on shared sources and published outputs
 */

/**
 * POST /api/social/interactions - Like or comment on content
 * Body: { action: 'like' | 'comment', target_type: string, target_id: string, comment_text?: string }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to interact with content')
    }

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.DATA_MODIFICATION)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const body = await request.json()
    const { action, target_type, target_id, comment_text } = body

    if (!action || !target_type || !target_id) {
      throw new ValidationError('action, target_type, and target_id are required')
    }

    if (action === 'like') {
      // Add like
      const { data: like, error } = await supabase
        .from('likes')
        .insert({
          user_id: user.id,
          target_type,
          target_id
        } as never)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new ValidationError('You have already liked this content')
        }
        console.error('Create like error:', error)
        throw new Error('Failed to like content')
      }

      return NextResponse.json({ like }, { status: 201 })
    } else if (action === 'comment') {
      // Add comment
      if (!comment_text?.trim()) {
        throw new ValidationError('comment_text is required for comments')
      }

      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          target_type,
          target_id,
          comment_text
        } as never)
        .select()
        .single()

      if (error) {
        console.error('Create comment error:', error)
        throw new Error('Failed to create comment')
      }

      return NextResponse.json({ comment }, { status: 201 })
    }

    throw new ValidationError('Invalid action. Must be "like" or "comment"')
  } catch (error) {
    console.error('Social interaction error:', error)
    return handleAPIError(error)
  }
}

/**
 * GET /api/social/interactions - Get likes and comments for content
 * Query params: target_type, target_id, type ('likes' | 'comments' | 'all')
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to view interactions')
    }

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SEARCH)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get('target_type')
    const targetId = searchParams.get('target_id')
    const interactionType = searchParams.get('type') || 'all'

    if (!targetType || !targetId) {
      throw new ValidationError('target_type and target_id are required')
    }

    let likes: unknown[] = []
    let comments: unknown[] = []

    if (interactionType === 'likes' || interactionType === 'all') {
      const { data } = await supabase
        .from('likes')
        .select('*')
        .eq('target_type', targetType)
        .eq('target_id', targetId)

      likes = data || []
    }

    if (interactionType === 'comments' || interactionType === 'all') {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .order('created_at', { ascending: true })

      comments = data || []
    }

    return NextResponse.json({
      likes,
      comments,
      likesCount: likes.length,
      commentsCount: comments.length
    })
  } catch (error) {
    console.error('Get interactions error:', error)
    return handleAPIError(error)
  }
}

/**
 * DELETE /api/social/interactions - Unlike or delete comment
 * Query params: action ('unlike' | 'delete_comment'), target_type, target_id, comment_id (for delete_comment)
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to delete interactions')
    }

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.DATA_MODIFICATION)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const targetType = searchParams.get('target_type')
    const targetId = searchParams.get('target_id')
    const commentId = searchParams.get('comment_id')

    if (action === 'unlike' && targetType && targetId) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('target_type', targetType)
        .eq('target_id', targetId)

      if (error) {
        console.error('Unlike error:', error)
        throw new Error('Failed to unlike content')
      }
      return NextResponse.json({ success: true })
    } else if (action === 'delete_comment' && commentId) {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Delete comment error:', error)
        throw new Error('Failed to delete comment')
      }
      return NextResponse.json({ success: true })
    }

    throw new ValidationError('Invalid action or missing required parameters')
  } catch (error) {
    console.error('Delete interaction error:', error)
    return handleAPIError(error)
  }
}
