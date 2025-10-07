import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { ExtractConceptsSchema } from '@/lib/validation/schemas'
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import { extractConcepts, normalizeConcept, generateConceptEmbedding } from '@/lib/concepts/extractor'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

// POST: Extract concepts from a source
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to extract concepts')
    }

    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.AI_ANALYSIS)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    // Validate request body
    const body = await request.json()
    const validation = ExtractConceptsSchema.safeParse(body)
    if (!validation.success) {
      throw new ValidationError(validation.error.issues[0].message)
    }

    const { source_id, min_relevance } = validation.data

    // Verify user owns this source
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .select(`
        id,
        original_content,
        summaries (
          summary_text,
          key_topics
        )
      `)
      .eq('id', source_id)
      .eq('user_id', user.id)
      .single()

    if (sourceError || !source) {
      throw new NotFoundError('Source not found or access denied')
    }

    // Combine content for concept extraction
    const summary = (source as any).summaries?.[0]
    const textToAnalyze = [
      summary?.summary_text || '',
      ...(summary?.key_topics || []),
    ].join('\n\n')

    if (!textToAnalyze.trim()) {
      throw new ValidationError('No content available to analyze. Please ensure the source has a summary.')
    }

    // Extract concepts using AI
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      throw new Error('AI service not configured')
    }

    const extractedConcepts = await extractConcepts(textToAnalyze, anthropicKey, 15)

    // Filter by relevance
    const filteredConcepts = extractedConcepts.filter(c => c.relevance >= min_relevance)

    if (filteredConcepts.length === 0) {
      return NextResponse.json({ concepts: [], total: 0 })
    }

    // Get or create concepts in database
    const conceptData = []

    for (const extracted of filteredConcepts) {
      const normalizedName = normalizeConcept(extracted.name)

      // Check if concept exists
      let { data: existingConcept } = await supabase
        .from('concepts')
        .select('*')
        .eq('normalized_name', normalizedName)
        .maybeSingle()

      if (!existingConcept) {
        // Create new concept with embedding
        const embedding = await generateConceptEmbedding(extracted.name)

        const { data: newConcept, error } = await supabase
          .from('concepts')
          .insert({
            name: extracted.name,
            normalized_name: normalizedName,
            embedding,
            frequency: 1,
          } as never)
          .select()
          .single()

        if (!error && newConcept) {
          existingConcept = newConcept
        }
      } else {
        // Increment frequency
        await supabase
          .from('concepts')
          .update({ frequency: (existingConcept as any).frequency + 1 } as never)
          .eq('id', (existingConcept as any).id)
      }

      if (existingConcept) {
        conceptData.push({
          ...(existingConcept as any),
          relevance: extracted.relevance,
          context: extracted.context,
        })

        // Link concept to source
        const { data: existingLink } = await supabase
          .from('source_concepts')
          .select('*')
          .eq('source_id', source_id)
          .eq('concept_id', (existingConcept as any).id)
          .maybeSingle()

        if (!existingLink) {
          await supabase
            .from('source_concepts')
            .insert({
              source_id,
              concept_id: (existingConcept as any).id,
              relevance: extracted.relevance,
              mentions: 1,
              context: extracted.context,
            } as never)
        }
      }
    }

    return NextResponse.json({
      concepts: conceptData,
      total: conceptData.length,
    })
  } catch (error) {
    console.error('Concept extraction error:', error)
    return handleAPIError(error)
  }
}
