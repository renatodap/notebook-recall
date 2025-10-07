import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { ShareSourceSchema, GetSharesQuerySchema } from '@/lib/validation/schemas'
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

/**
 * Feature 25: Public/Private Source Sharing
 * Share sources publicly or with specific users
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to share sources')
    }

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.DATA_MODIFICATION)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const body = await request.json()
    const validation = ShareSourceSchema.safeParse(body)

    if (!validation.success) {
      throw new ValidationError(validation.error.issues[0].message)
    }

    const { source_id, visibility, shared_with_user_ids } = validation.data

    // Verify ownership
    const { data: source } = await supabase
      .from('sources')
      .select('id')
      .eq('id', source_id)
      .eq('user_id', user.id)
      .single()

    if (!source) {
      throw new NotFoundError('Source not found or you do not have permission to share it')
    }

    // Create or update share
    const { data: share, error } = await supabase
      .from('source_shares')
      .upsert({
        source_id,
        owner_id: user.id,
        visibility,
        shared_with_user_ids: visibility === 'specific' ? shared_with_user_ids : null,
        updated_at: new Date().toISOString()
      } as never, {
        onConflict: 'source_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Create share error:', error)
      throw new Error('Failed to share source')
    }

    return NextResponse.json({ share }, { status: 201 })
  } catch (error) {
    console.error('Share source error:', error)
    return handleAPIError(error)
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to view shares')
    }

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SEARCH)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const { searchParams } = new URL(request.url)
    const queryParams = {
      type: searchParams.get('type') || 'owned'
    }

    const validation = GetSharesQuerySchema.safeParse(queryParams)
    if (!validation.success) {
      throw new ValidationError(validation.error.issues[0].message)
    }

    const { type } = validation.data

    if (type === 'owned') {
      // Get shares I created
      const { data: shares, error } = await supabase
        .from('source_shares')
        .select('*, sources (id, title, created_at)')
        .eq('owner_id', user.id)

      if (error) {
        console.error('Fetch owned shares error:', error)
        throw new Error('Failed to fetch shares')
      }
      return NextResponse.json({ shares: shares || [] })
    } else if (type === 'shared_with_me') {
      // Get public shares + shares specifically with me
      const { data: publicShares } = await supabase
        .from('source_shares')
        .select('*, sources (id, title, created_at)')
        .eq('visibility', 'public')
        .neq('owner_id', user.id)

      const { data: specificShares } = await supabase
        .from('source_shares')
        .select('*, sources (id, title, created_at)')
        .contains('shared_with_user_ids', [user.id])

      const shares = [...(publicShares || []), ...(specificShares || [])]
      return NextResponse.json({ shares })
    }

    return NextResponse.json({ shares: [] })
  } catch (error) {
    console.error('Get shares error:', error)
    return handleAPIError(error)
  }
}
