import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
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
 * POST /api/email-capture - Process incoming email capture (webhook endpoint)
 * Body: { from: string, subject: string, body: string, user_email: string }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient

    // Parse email content
    const body = await request.json()
    const { from, subject, body: emailBody, user_email } = body

    if (!from || !user_email || !emailBody) {
      throw new ValidationError('Missing required fields: from, user_email, and body are required')
    }

    // Find user by capture email
    const { data: userPref, error: prefError } = await supabase
      .from('user_preferences')
      .select('user_id')
      .eq('capture_email', user_email)
      .maybeSingle()

    if (prefError || !userPref) {
      throw new NotFoundError('Invalid capture email address')
    }

    const userId = (userPref as any).user_id

    // Rate limit by user ID
    const rateLimit = await checkRateLimit(userId, RATE_LIMITS.DATA_MODIFICATION)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    // Save email capture
    const { data: capture, error: captureError } = await supabase
      .from('email_captures')
      .insert({
        user_id: userId,
        email_from: from,
        email_subject: subject,
        email_body: emailBody,
        metadata: {
          received_at: new Date().toISOString()
        }
      } as never)
      .select()
      .single()

    if (captureError) {
      console.error('Capture error:', captureError)
      throw new Error('Failed to save email capture')
    }

    const captureId = (capture as any).id

    // Create source from email
    const title = subject || `Email from ${from}`
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .insert({
        user_id: userId,
        title,
        content_type: 'email',
        original_content: emailBody,
        url: from,
        metadata: {
          from,
          subject,
          captured_via: 'email'
        }
      } as never)
      .select()
      .single()

    if (sourceError) {
      console.error('Create source error:', sourceError)
      throw new Error('Failed to create source from email')
    }

    const sourceId = (source as any).id

    // Update capture with source_id
    const { error: updateError } = await supabase
      .from('email_captures')
      .update({ source_id: sourceId, processed: true } as never)
      .eq('id', captureId)

    if (updateError) {
      console.error('Update capture error:', updateError)
    }

    // Auto-summarize
    try {
      await fetch(`${request.nextUrl.origin}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_id: sourceId })
      })
    } catch (err) {
      console.error('Summarization error:', err)
    }

    return NextResponse.json({ success: true, source_id: sourceId }, { status: 201 })

  } catch (error) {
    console.error('Email capture error:', error)
    return handleAPIError(error)
  }
}

/**
 * GET /api/email-capture - Get user's capture email address
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to view capture email')
    }

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SEARCH)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const { data: pref, error: prefError } = await supabase
      .from('user_preferences')
      .select('capture_email')
      .eq('user_id', user.id)
      .maybeSingle()

    if (prefError) {
      console.error('Fetch preferences error:', prefError)
      throw new Error('Failed to fetch capture email')
    }

    return NextResponse.json({ capture_email: (pref as any)?.capture_email || null })

  } catch (error) {
    console.error('Get capture email error:', error)
    return handleAPIError(error)
  }
}
