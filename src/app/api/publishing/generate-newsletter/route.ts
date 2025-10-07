import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { generateNewsletter, wrapNewsletterHTML } from '@/lib/publishing/newsletter-generator'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { GenerateNewsletterRequestSchema } from '@/lib/validation/schemas'
import {
  RateLimitError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import type { DatabaseSource } from '@/types/api'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to generate newsletters')
    }

    // Rate limiting check
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.AI_PUBLISHING)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `You have reached your daily limit of ${RATE_LIMITS.AI_PUBLISHING.maxRequests} publishing requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    // Validate request body
    const body = await request.json()
    const validation = GenerateNewsletterRequestSchema.safeParse(body)

    if (!validation.success) {
      throw new ValidationError(validation.error.issues[0].message)
    }

    const {
      source_ids,
      newsletter_name,
      theme,
      sections,
      tone,
      format,
    } = validation.data

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
      throw new NotFoundError('Sources not found or access denied')
    }

    // Prepare sources for newsletter generation
    const newsletterInput = sources.map((s: any) => ({
      id: s.id,
      title: s.title,
      summary: s.summaries?.[0]?.summary_text,
      key_topics: s.summaries?.[0]?.key_topics,
    }))

    // Generate newsletter using AI
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      throw new Error('AI service not configured')
    }

    const newsletter = await generateNewsletter(
      {
        sources: newsletterInput,
        newsletter_name,
        theme,
        sections,
        tone,
        format,
      } as any,
      anthropicKey
    )

    // Wrap in HTML if needed
    const finalContent = format === 'html'
      ? wrapNewsletterHTML(newsletter, newsletter_name)
      : newsletter.content

    // Save to database
    const { data: output, error: outputError } = await supabase
      .from('published_outputs')
      .insert({
        user_id: user.id,
        output_type: 'newsletter',
        title: newsletter.subject_line,
        content: finalContent,
        metadata: {
          ...newsletter.metadata,
          newsletter_name,
          preview_text: newsletter.preview_text,
          sections: newsletter.sections,
          tone,
          format,
        },
        status: 'draft',
      } as never)
      .select()
      .single()

    if (outputError) {
      console.error('Save output error:', outputError)
      throw new Error('Failed to save newsletter')
    }

    // Link sources to output
    const links = source_ids.map((sid: string) => ({
      output_id: (output as any).id,
      source_id: sid,
    }))

    await supabase
      .from('output_sources')
      .insert(links as never)

    return NextResponse.json({ output, newsletter }, {
      status: 201,
      headers: {
        'X-RateLimit-Limit': RATE_LIMITS.AI_PUBLISHING.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
      }
    })
  } catch (error) {
    console.error('Newsletter generation error:', error)
    return handleAPIError(error)
  }
}
