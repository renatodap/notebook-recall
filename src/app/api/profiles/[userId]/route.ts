import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const supabase = await createRouteHandlerClient()

    const { data: profile } = await (supabase as any)
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_public', true)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found or private' }, { status: 404 })
    }

    const { count: followerCount } = await (supabase as any)
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)

    const { count: followingCount } = await (supabase as any)
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)

    const { count: publicSourcesCount } = await (supabase as any)
      .from('source_shares')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('visibility', 'public')

    return NextResponse.json({
      profile,
      stats: {
        followers: followerCount || 0,
        following: followingCount || 0,
        publicSources: publicSourcesCount || 0
      }
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { display_name, username, bio, avatar_url, is_public, research_interests, affiliation, website_url } = body

    const updates: any = {}
    if (display_name !== undefined) updates.display_name = display_name
    if (username !== undefined) updates.username = username
    if (bio !== undefined) updates.bio = bio
    if (avatar_url !== undefined) updates.avatar_url = avatar_url
    if (is_public !== undefined) updates.is_public = is_public
    if (research_interests !== undefined) updates.research_interests = research_interests
    if (affiliation !== undefined) updates.affiliation = affiliation
    if (website_url !== undefined) updates.website_url = website_url
    updates.updated_at = new Date().toISOString()

    const { data: profile, error } = await (supabase as any)
      .from('user_profiles')
      .upsert({
        user_id: userId,
        ...updates
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
