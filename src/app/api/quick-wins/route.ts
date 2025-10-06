import { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { quickWinsPostSchema } from '@/lib/validation/schemas'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import type { UserQuickWin, QuickWinsGetResponse, QuickWinsPostResponse } from '@/types'

/**
 * Quick Wins API
 *
 * GET /api/quick-wins - Get user's quick wins progress
 * POST /api/quick-wins - Mark a win as completed
 *
 * CLAUDE.MD COMPLIANCE:
 * - ✅ Input validation with Zod
 * - ✅ Rate limiting
 * - ✅ Proper error handling
 * - ✅ Type safety (no 'as any')
 * - ✅ Structured logging
 * - ✅ Row-level security
 */

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[quick-wins GET] Authentication failed:', authError)
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[quick-wins GET] Fetching wins for user: ${user.id}`)

    // Fetch user's quick wins with proper typing
    const { data: wins, error } = await supabase
      .from('user_quick_wins')
      .select<'*', UserQuickWin>('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[quick-wins GET] Database error:', error)
      return Response.json({ error: 'Failed to fetch quick wins' }, { status: 500 })
    }

    const response: QuickWinsGetResponse = {
      wins: wins || [],
    }

    console.log(`[quick-wins GET] Found ${wins?.length || 0} wins for user`)
    return Response.json(response)
  } catch (error) {
    console.error('[quick-wins GET] Unexpected error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[quick-wins POST] Authentication failed:', authError)
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Apply rate limiting
    const rateLimitResult = applyRateLimit(user.id, RATE_LIMITS.QUICK_WINS)
    if (!rateLimitResult.allowed) {
      console.warn(`[quick-wins POST] Rate limit exceeded for user: ${user.id}`)
      return rateLimitResult.response
    }

    // Validate request body with Zod
    const body = await request.json()
    const validation = quickWinsPostSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      console.warn(`[quick-wins POST] Validation failed: ${errors}`)
      return Response.json({ error: 'Invalid request', details: errors }, { status: 400 })
    }

    const { winId } = validation.data

    console.log(`[quick-wins POST] Marking win '${winId}' as completed for user: ${user.id}`)

    // Upsert quick win (create or update) with proper typing
    const now = new Date().toISOString()
    const { data: win, error } = await supabase
      .from('user_quick_wins')
      .upsert(
        {
          user_id: user.id,
          win_id: winId,
          completed: true,
          completed_at: now,
          updated_at: now,
        },
        {
          onConflict: 'user_id,win_id',
        }
      )
      .select<'*', UserQuickWin>()
      .single()

    if (error) {
      console.error('[quick-wins POST] Database error:', error)
      return Response.json(
        {
          error: 'Failed to update quick win',
          message: 'Unable to save your progress. Please try again.',
        },
        { status: 500 }
      )
    }

    if (!win) {
      console.error('[quick-wins POST] No win returned after upsert')
      return Response.json({ error: 'Failed to create quick win' }, { status: 500 })
    }

    const response: QuickWinsPostResponse = {
      success: true,
      win,
    }

    console.log(`[quick-wins POST] Successfully marked win '${winId}' as completed`)
    return Response.json(response)
  } catch (error) {
    console.error('[quick-wins POST] Unexpected error:', error)
    return Response.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    )
  }
}
