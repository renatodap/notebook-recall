import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { AuthenticationError, RateLimitError, handleAPIError } from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

/**
 * GET /api/timeline - Get timeline of sources grouped by period
 * Query params:
 *   - group_by: 'day' | 'week' | 'month' | 'year' (default: 'month')
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to view timeline')
    }

    // Rate limiting - SEARCH limit for GET
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SEARCH)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const { searchParams } = new URL(request.url)
    const groupBy = searchParams.get('group_by') || 'month' // day, week, month, year

    // Fetch all sources with timestamps
    const { data: sources, error } = await supabase
      .from('sources')
      .select('id, title, content_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Fetch sources error:', error)
      throw new Error('Failed to fetch sources')
    }

    // Group sources by time period
    const timeline: Record<string, any[]> = {}

    sources?.forEach((source: any) => {
      const date = new Date(source.created_at)
      let key: string

      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0]
          break
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        case 'year':
          key = String(date.getFullYear())
          break
        default:
          key = date.toISOString().split('T')[0]
      }

      if (!timeline[key]) {
        timeline[key] = []
      }

      timeline[key].push(source)
    })

    // Convert to array and sort
    const timelineArray = Object.entries(timeline).map(([period, sources]) => ({
      period,
      count: sources.length,
      sources,
    })).sort((a, b) => a.period.localeCompare(b.period))

    return NextResponse.json({
      timeline: timelineArray,
      total_periods: timelineArray.length,
      total_sources: sources?.length || 0,
      group_by: groupBy,
    })
  } catch (error) {
    console.error('GET timeline error:', error)
    return handleAPIError(error)
  }
}
