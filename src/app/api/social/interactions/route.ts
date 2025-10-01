import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

/**
 * Feature 28: Social Features (Likes, Comments)
 * Like and comment on shared sources and published outputs
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, target_type, target_id, comment_text } = body

    if (!action || !target_type || !target_id) {
      return NextResponse.json({
        error: 'action, target_type, and target_id required'
      }, { status: 400 })
    }

    if (action === 'like') {
      // Add like
      const { data: like, error } = await (supabase as any)
        .from('likes')
        .insert({
          user_id: user.id,
          target_type,
          target_id
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'Already liked' }, { status: 400 })
        }
        throw error
      }

      return NextResponse.json({ like }, { status: 201 })
    } else if (action === 'comment') {
      // Add comment
      if (!comment_text?.trim()) {
        return NextResponse.json({ error: 'comment_text required' }, { status: 400 })
      }

      const { data: comment, error } = await (supabase as any)
        .from('comments')
        .insert({
          user_id: user.id,
          target_type,
          target_id,
          comment_text
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ comment }, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Social interaction error:', error)
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

    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get('target_type')
    const targetId = searchParams.get('target_id')
    const interactionType = searchParams.get('type') || 'all'

    if (!targetType || !targetId) {
      return NextResponse.json({
        error: 'target_type and target_id required'
      }, { status: 400 })
    }

    let likes: any[] = []
    let comments: any[] = []

    if (interactionType === 'likes' || interactionType === 'all') {
      const { data } = await (supabase as any)
        .from('likes')
        .select('*')
        .eq('target_type', targetType)
        .eq('target_id', targetId)

      likes = data || []
    }

    if (interactionType === 'comments' || interactionType === 'all') {
      const { data } = await (supabase as any)
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const targetType = searchParams.get('target_type')
    const targetId = searchParams.get('target_id')
    const commentId = searchParams.get('comment_id')

    if (action === 'unlike' && targetType && targetId) {
      const { error } = await (supabase as any)
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('target_type', targetType)
        .eq('target_id', targetId)

      if (error) throw error
      return NextResponse.json({ success: true })
    } else if (action === 'delete_comment' && commentId) {
      const { error } = await (supabase as any)
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id)

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Delete interaction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
