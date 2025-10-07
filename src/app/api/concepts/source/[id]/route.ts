import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { ResourceIdParamSchema } from '@/lib/validation/schemas'
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to view concepts')
    }

    // Rate limiting - SEARCH limit for GET
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.SEARCH)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const resolvedParams = await params
    const validation = ResourceIdParamSchema.safeParse(resolvedParams)
    if (!validation.success) {
      throw new ValidationError('Invalid source ID format')
    }

    const { id: sourceId } = validation.data

    // Verify user owns this source
    const { data: source } = await supabase
      .from('sources')
      .select('id')
      .eq('id', sourceId)
      .eq('user_id', user.id)
      .single()

    if (!source) {
      throw new NotFoundError('Source not found or access denied')
    }

    // Fetch concepts for this source
    const { data: sourceConcepts, error } = await supabase
      .from('source_concepts')
      .select(`
        *,
        concept:concepts (*)
      `)
      .eq('source_id', sourceId)
      .order('relevance', { ascending: false })

    if (error) {
      console.error('Fetch concepts error:', error)
      throw new Error('Failed to fetch concepts')
    }

    const concepts = sourceConcepts?.map((sc: any) => ({
      ...sc.concept,
      relevance: sc.relevance,
      context: sc.context,
    })) || []

    return NextResponse.json({
      concepts,
      total: concepts.length,
    })
  } catch (error) {
    console.error('Get concepts error:', error)
    return handleAPIError(error)
  }
}
