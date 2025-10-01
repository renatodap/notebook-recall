import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

/**
 * Feature 26: Follow Researchers
 * Follow other users to see their public sources and activity
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { user_id_to_follow } = body

    if (!user_id_to_follow) {
      return NextResponse.json({ error: 'user_id_to_follow required' }, { status: 400 })
    }

    if (user_id_to_follow === user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    // Create follow relationship
    const { data: follow, error } = await (supabase as any)
      .from('user_follows')
      .insert({
        follower_id: user.id,
        following_id: user_id_to_follow
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Already following this user' }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ follow }, { status: 201 })
  } catch (error) {
    console.error('Follow user error:', error)
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
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    const { error } = await (supabase as any)
      .from('user_follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unfollow user error:', error)
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
    const type = searchParams.get('type') || 'following'

    if (type === 'following') {
      // Get users I'm following
      const { data: following, error } = await (supabase as any)
        .from('user_follows')
        .select('following_id, created_at')
        .eq('follower_id', user.id)

      if (error) throw error
      return NextResponse.json({ following })
    } else if (type === 'followers') {
      // Get my followers
      const { data: followers, error } = await (supabase as any)
        .from('user_follows')
        .select('follower_id, created_at')
        .eq('following_id', user.id)

      if (error) throw error
      return NextResponse.json({ followers })
    }

    return NextResponse.json({ users: [] })
  } catch (error) {
    console.error('Get follows error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
