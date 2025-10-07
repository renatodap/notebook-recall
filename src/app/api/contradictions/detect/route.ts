import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { detectAllContradictions, groupContradictionsByTopic, getContradictionStats } from '@/lib/contradictions/detector'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { DetectContradictionsSchema } from '@/lib/validation/schemas'
import {
  RateLimitError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'

// POST: Detect contradictions between sources
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to detect contradictions')
    }

    // Rate limiting check
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.AI_CONTRADICTIONS)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `You have reached your daily limit of ${RATE_LIMITS.AI_CONTRADICTIONS.maxRequests} contradiction detections. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    // Validate request body
    const body = await request.json()
    const validation = DetectContradictionsSchema.safeParse(body)
    if (!validation.success) {
      throw new ValidationError(validation.error.issues[0].message)
    }

    const { source_ids, threshold } = validation.data

    // Verify user owns all sources
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select(`
        id,
        title,
        summaries (
          summary_text
        )
      `)
      .in('id', source_ids)
      .eq('user_id', user.id)

    if (sourcesError || !sources || sources.length < 2) {
      throw new NotFoundError('At least 2 sources are required and must be accessible')
    }

    // Prepare sources for analysis
    const sourcesForAnalysis = sources.map((s: any) => ({
      id: s.id,
      title: s.title,
      summary: s.summaries?.[0]?.summary_text || '',
    }))

    // Detect contradictions using AI
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      throw new Error('AI service not configured')
    }

    const contradictions = await detectAllContradictions(
      sourcesForAnalysis,
      anthropicKey,
      threshold
    )

    // Save contradictions to database
    if (contradictions.length > 0) {
      const contradictionsToInsert = contradictions.map(c => ({
        source_a_id: c.source_a_id,
        source_b_id: c.source_b_id,
        claim_a: c.claim_a,
        claim_b: c.claim_b,
        severity: c.severity,
        confidence: c.confidence,
        explanation: c.explanation,
        topic: c.topic,
        detected_by: user.id,
        auto_detected: true,
      }))

      await supabase
        .from('contradictions')
        .insert(contradictionsToInsert as never)
    }

    // Group and analyze
    const grouped = groupContradictionsByTopic(contradictions)
    const stats = getContradictionStats(contradictions)

    return NextResponse.json({
      contradictions,
      grouped,
      stats,
      total: contradictions.length,
    }, {
      status: 201,
      headers: {
        'X-RateLimit-Limit': RATE_LIMITS.AI_CONTRADICTIONS.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
      }
    })
  } catch (error) {
    console.error('Contradiction detection error:', error)
    return handleAPIError(error)
  }
}
