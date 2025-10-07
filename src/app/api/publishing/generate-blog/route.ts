import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { generateBlogPost } from '@/lib/publishing/blog-generator'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import {
  RateLimitError,
  AuthenticationError,
  NotFoundError,
  ConfigurationError,
  DatabaseError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import {
  generateBlogPostSchema,
  validateRequestBody,
} from '@/lib/validation'
import { DatabaseSource } from '@/types/api'

/**
 * POST /api/publishing/generate-blog - Generate AI blog post
 * @returns Promise<NextResponse> - Created blog post output
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to generate blog posts')
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
    const {
      source_ids,
      title,
      target_audience,
      tone,
      length,
      focus,
      custom_instructions,
      include_citations,
    } = await validateRequestBody(request, generateBlogPostSchema)

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
      .in('id', source_ids as any)
      .eq('user_id', user.id)

    if (sourcesError || !sources || sources.length === 0) {
      throw new NotFoundError('No sources found with the provided IDs')
    }

    // Prepare sources for blog generation
    const blogInput = sources.map((s: any) => ({
      id: s.id,
      title: s.title,
      summary: s.summaries?.[0]?.summary_text,
      key_topics: s.summaries?.[0]?.key_topics,
    }))

    // Generate blog post using AI
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      throw new ConfigurationError(
        'AI service is not configured. Please contact support.'
      )
    }

    const blogPost = await generateBlogPost(
      {
        sources: blogInput,
        target_audience: target_audience as 'general' | 'technical' | 'academic' | 'business' | undefined,
        tone: tone as 'formal' | 'casual' | 'professional' | 'conversational' | undefined,
        length,
        focus,
        custom_instructions,
      },
      anthropicKey
    )

    // Save to database
    const { data: output, error: outputError } = await supabase
      .from('published_outputs')
      .insert({
        user_id: user.id,
        output_type: 'blog_post',
        title: title || blogPost.title,
        content: blogPost.content,
        metadata: {
          ...blogPost.metadata,
          subtitle: blogPost.subtitle,
          seo_title: blogPost.seo_title,
          seo_description: blogPost.seo_description,
          tags: blogPost.tags,
          estimated_reading_time: blogPost.estimated_reading_time,
          target_audience,
          tone,
          length,
        },
        status: 'draft',
      } as any)
      .select()
      .single()

    if (outputError) {
      console.error('Save output error:', outputError)
      throw new DatabaseError('Failed to save blog post. Please try again.')
    }

    // Link sources to output
    const links = source_ids.map((sid: string) => ({
      output_id: (output as any).id,
      source_id: sid,
    }))

    await supabase
      .from('output_sources')
      .insert(links as any)

    return NextResponse.json({ output, blog_post: blogPost }, {
      status: 201,
      headers: {
        'X-RateLimit-Limit': RATE_LIMITS.AI_PUBLISHING.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
      }
    })
  } catch (error) {
    console.error('Blog generation error:', error)
    return handleAPIError(error)
  }
}
