import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { generateSynthesisReport } from '@/lib/synthesis/generator'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import {
  RateLimitError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  AuthorizationError,
  DatabaseError,
  ConfigurationError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import {
  generateSynthesisSchema,
  validateRequestBody,
} from '@/lib/validation'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import { DatabaseSource } from '@/types/api'

/**
 * POST /api/synthesis/generate - Generate AI synthesis report
 * @returns Promise<NextResponse> - Created synthesis report
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to generate synthesis reports')
    }

    // Rate limiting check
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.AI_SYNTHESIS)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `You have reached your daily limit of ${RATE_LIMITS.AI_SYNTHESIS.maxRequests} synthesis reports. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    // Validate request body
    const { source_ids, title, focus, report_type } = await validateRequestBody(
      request,
      generateSynthesisSchema
    )

    // Verify user owns all sources
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select(`
        id,
        title,
        summaries (
          summary_text,
          key_topics
        )
      `)
      .in('id', source_ids)
      .eq('user_id', user.id)

    if (sourcesError || !sources || sources.length === 0) {
      throw new NotFoundError('No sources found with the provided IDs')
    }

    if (sources.length !== source_ids.length) {
      throw new AuthorizationError(
        'You do not have access to all the requested sources'
      )
    }

    // Prepare sources for synthesis
    const synthesisInput = sources.map((s: any) => ({
      id: s.id,
      title: s.title,
      summary: s.summaries?.[0]?.summary_text,
      key_topics: s.summaries?.[0]?.key_topics,
    }))

    // Generate synthesis using AI
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      throw new ConfigurationError(
        'AI service is not configured. Please contact support.'
      )
    }

    const synthesis = await generateSynthesisReport(
      {
        sources: synthesisInput,
        focus,
        report_type: report_type as 'literature_review' | 'comparative' | 'thematic' | 'chronological' | undefined,
      },
      anthropicKey
    )

    // Save synthesis report to database
    const { data: report, error: reportError } = await supabase
      .from('synthesis_reports')
      .insert({
        user_id: user.id,
        title: title || synthesis.title,
        focus: focus || null,
        report_type,
        executive_summary: synthesis.executive_summary,
        themes: synthesis.themes,
        key_findings: synthesis.key_findings,
        agreements: synthesis.agreements,
        disagreements: synthesis.disagreements,
        gaps: synthesis.gaps,
        full_report: synthesis.full_report,
        source_count: sources.length,
        metadata: synthesis.metadata,
      } as never)
      .select()
      .single()

    if (reportError || !report) {
      console.error('Save synthesis report error:', reportError)
      throw new DatabaseError('Failed to save synthesis report. Please try again.')
    }

    const savedReport = report as unknown as { id: string; [key: string]: unknown }

    // Link sources to report
    const links = source_ids.map(sid => ({
      synthesis_id: savedReport.id,
      source_id: sid,
    }))

    await supabase
      .from('synthesis_sources')
      .insert(links as never)

    return NextResponse.json({ report: savedReport }, {
      status: 201,
      headers: {
        'X-RateLimit-Limit': RATE_LIMITS.AI_SYNTHESIS.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
      }
    })
  } catch (error) {
    console.error('Synthesis generation error:', error)
    return handleAPIError(error)
  }
}
