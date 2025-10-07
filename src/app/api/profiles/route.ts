import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { handleAPIError } from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { RateLimitError } from '@/lib/errors/custom-errors'

/**
 * GET /api/profiles - Get public user profiles (no auth required)
 * Query params:
 *   - search: Search term for display_name, username, or bio
 *   - limit: Number of profiles to return (default 20, max 100)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient

    // Check rate limit using IP address for unauthenticated requests
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimit = await checkRateLimit(ip, RATE_LIMITS.SEARCH)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    let query = supabase
      .from('user_profiles')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (search) {
      query = query.or(`display_name.ilike.%${search}%,username.ilike.%${search}%,bio.ilike.%${search}%`)
    }

    const { data: profiles, error } = await query

    if (error) {
      console.error('Fetch profiles error:', error)
      throw new Error('Failed to fetch profiles')
    }

    return NextResponse.json({ profiles: profiles || [] })
  } catch (error) {
    console.error('Get profiles error:', error)
    return handleAPIError(error)
  }
}
