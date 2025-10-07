import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import {
  AuthenticationError,
  RateLimitError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

// GET: List all synthesis reports for current user
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to view synthesis reports')
    }

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SEARCH)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const { data: reports, error } = await supabase
      .from('synthesis_reports')
      .select(`
        id,
        title,
        focus,
        report_type,
        executive_summary,
        source_count,
        created_at,
        metadata
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch synthesis reports error:', error)
      throw new Error('Failed to fetch synthesis reports')
    }

    return NextResponse.json({
      reports: reports || [],
      total: reports?.length || 0,
    })
  } catch (error) {
    console.error('GET synthesis reports error:', error)
    return handleAPIError(error)
  }
}
