import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { GetPublishedOutputsQuerySchema } from '@/lib/validation/schemas'
import {
  AuthenticationError,
  ValidationError,
  RateLimitError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

// GET: List all published outputs for current user
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to view published outputs')
    }

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SEARCH)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      type: searchParams.get('type'),
    }

    const validation = GetPublishedOutputsQuerySchema.safeParse(queryParams)
    if (!validation.success) {
      throw new ValidationError(validation.error.issues[0].message)
    }

    const { type: outputType } = validation.data

    let query = supabase
      .from('published_outputs')
      .select('id, output_type, title, status, created_at, metadata')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (outputType) {
      query = query.eq('output_type', outputType)
    }

    const { data: outputs, error } = await query

    if (error) {
      console.error('Fetch outputs error:', error)
      throw new Error('Failed to fetch published outputs')
    }

    return NextResponse.json({
      outputs: outputs || [],
      total: outputs?.length || 0,
    })
  } catch (error) {
    console.error('GET published outputs error:', error)
    return handleAPIError(error)
  }
}
