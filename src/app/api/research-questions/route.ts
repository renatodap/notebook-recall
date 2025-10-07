import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { CreateResearchQuestionSchema } from '@/lib/validation/schemas'
import {
  AuthenticationError,
  ValidationError,
  RateLimitError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

// GET: List all research questions
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to view research questions')
    }

    // Rate limiting - SEARCH limit for GET
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SEARCH)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const { data: questions, error } = await supabase
      .from('research_questions')
      .select(`
        *,
        question_sources (
          source:sources (id, title)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch questions error:', error)
      throw new Error('Failed to fetch research questions')
    }

    return NextResponse.json({
      questions: questions || [],
      total: questions?.length || 0,
    })
  } catch (error) {
    console.error('GET questions error:', error)
    return handleAPIError(error)
  }
}

// POST: Create research question
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to create research questions')
    }

    // Rate limiting - DATA_MODIFICATION limit for POST
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.DATA_MODIFICATION)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many modifications. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    // Validate request body
    const body = await request.json()
    const validation = CreateResearchQuestionSchema.safeParse(body)
    if (!validation.success) {
      throw new ValidationError(validation.error.issues[0].message)
    }

    const validatedData = validation.data

    // Create question
    const { data: question, error: createError } = await supabase
      .from('research_questions')
      .insert({
        user_id: user.id,
        question_text: validatedData.question_text,
        category: validatedData.category,
        priority: validatedData.priority,
        status: 'open',
      } as never)
      .select()
      .single()

    if (createError || !question) {
      console.error('Create question error:', createError)
      throw new Error('Failed to create research question')
    }

    const createdQuestion = question as unknown as { id: string; [key: string]: unknown }

    // Link sources if provided
    if (validatedData.source_ids && validatedData.source_ids.length > 0) {
      const links = validatedData.source_ids.map((sid: string) => ({
        question_id: createdQuestion.id,
        source_id: sid,
      }))

      const { error: linkError } = await supabase
        .from('question_sources')
        .insert(links as never)

      if (linkError) {
        console.error('Link sources error:', linkError)
        // Don't fail the request if linking sources fails
      }
    }

    return NextResponse.json({ question: createdQuestion }, { status: 201 })
  } catch (error) {
    console.error('POST question error:', error)
    return handleAPIError(error)
  }
}
