import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await params
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient

    // Check rate limit using IP address for public profile viewing
    const { checkRateLimit, RATE_LIMITS } = await import('@/lib/rate-limiter')
    const { RateLimitError } = await import('@/lib/errors/custom-errors')
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimit = await checkRateLimit(ip, RATE_LIMITS.SEARCH)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_public', true)
      .single()

    if (!profile) {
      throw new NotFoundError('Profile not found or private')
    }

    const { count: followerCount } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)

    const { count: followingCount } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)

    const { count: publicSourcesCount } = await supabase
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
    return handleAPIError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await params
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to update your profile')
    }

    if (user.id !== userId) {
      throw new AuthorizationError('You can only update your own profile')
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
    const { display_name, username, bio, avatar_url, is_public, research_interests, affiliation, website_url } = body

    const updates: Record<string, unknown> = {}
    if (display_name !== undefined) updates.display_name = display_name
    if (username !== undefined) updates.username = username
    if (bio !== undefined) updates.bio = bio
    if (avatar_url !== undefined) updates.avatar_url = avatar_url
    if (is_public !== undefined) updates.is_public = is_public
    if (research_interests !== undefined) updates.research_interests = research_interests
    if (affiliation !== undefined) updates.affiliation = affiliation
    if (website_url !== undefined) updates.website_url = website_url
    updates.updated_at = new Date().toISOString()

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        ...updates
      } as never, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Update profile error:', error)
    return handleAPIError(error)
  }
}
