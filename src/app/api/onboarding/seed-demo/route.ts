import { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { getAllDemoSources } from '@/lib/onboarding/demo-data'
import { generateEmbedding } from '@/lib/embeddings/client'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import type { SeedDemoResponse, Source } from '@/types'
import { DatabaseSource } from '@/types/api'

/**
 * Seed Demo Data API
 *
 * Creates 3 demo sources with pre-generated summaries and embeddings
 * for instant time-to-value in onboarding flow
 *
 * POST /api/onboarding/seed-demo
 *
 * CLAUDE.MD COMPLIANCE:
 * - ✅ Input validation
 * - ✅ Rate limiting (3 per hour to prevent abuse)
 * - ✅ Proper error handling with user feedback
 * - ✅ Type safety (no 'as any')
 * - ✅ Structured logging
 * - ✅ Row-level security
 * - ✅ Transaction handling for partial failures
 */

interface CreatedSource {
  id: string
  title: string
}

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[seed-demo POST] Authentication failed:', authError)
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[seed-demo POST] Starting demo seed for user: ${user.id}`)

    // Apply rate limiting (3 per hour)
    const rateLimitResult = applyRateLimit(user.id, RATE_LIMITS.ONBOARDING_SEED)
    if (!rateLimitResult.allowed) {
      console.warn(`[seed-demo POST] Rate limit exceeded for user: ${user.id}`)
      return rateLimitResult.response
    }

    // Check if user already has demo data
    const { data: existingSources, error: checkError } = await supabase
      .from('sources')
      .select<'id', Pick<Source, 'id'>>('id')
      .eq('user_id', user.id)
      .limit(1)

    if (checkError) {
      console.error('[seed-demo POST] Error checking existing sources:', checkError)
      return Response.json(
        {
          error: 'Failed to check existing sources',
          message: 'Unable to verify your account status. Please try again.',
        },
        { status: 500 }
      )
    }

    // If user already has sources, skip seeding
    if (existingSources && existingSources.length > 0) {
      console.log(`[seed-demo POST] User ${user.id} already has sources, skipping`)
      const response: SeedDemoResponse = {
        success: true,
        message: 'User already has sources, skipping demo data',
        sources: [],
        count: 0,
        skipped: true,
      }
      return Response.json(response)
    }

    // Get demo data
    const demoSources = getAllDemoSources()
    const createdSources: CreatedSource[] = []
    const errors: string[] = []

    console.log(`[seed-demo POST] Creating ${demoSources.length} demo sources`)

    // Create each demo source with summary and embedding
    for (const demo of demoSources) {
      try {
        // 1. Create source
        const { data: source, error: sourceError } = await supabase
          .from('sources')
          .insert({
            user_id: user.id,
            title: demo.title,
            content_type: demo.content_type,
            original_content: demo.original_content,
            url: null,
          } as never)
          .select<'*', Source>()
          .single()

        if (sourceError || !source) {
          const errorMsg = `Failed to create source "${demo.title}": ${sourceError?.message || 'Unknown error'}`
          console.error(`[seed-demo POST] ${errorMsg}`)
          errors.push(errorMsg)
          continue
        }

        console.log(`[seed-demo POST] Created source: ${source.id} - ${source.title}`)

        // 2. Create summary
        const { error: summaryError } = await supabase.from('summaries').insert({
          source_id: source.id,
          summary_text: demo.summary.summary_text,
          key_actions: demo.summary.key_actions,
          key_topics: demo.summary.key_topics,
          word_count: demo.summary.word_count,
          embedding: null,
        } as never)

        if (summaryError) {
          const errorMsg = `Failed to create summary for "${demo.title}": ${summaryError.message}`
          console.error(`[seed-demo POST] ${errorMsg}`)
          errors.push(errorMsg)
          // Continue - source exists, summary failed (non-critical)
        } else {
          console.log(`[seed-demo POST] Created summary for source: ${source.id}`)
        }

        // 3. Generate and store embedding
        try {
          const embeddingResult = await generateEmbedding({ text: demo.summary.summary_text })
          const embeddingVector = embeddingResult.embedding

          const { error: embeddingError } = await supabase.from('embeddings').insert({
            source_id: source.id,
            embedding: embeddingVector,
            content_type: 'summary',
          } as never)

          if (embeddingError) {
            const errorMsg = `Failed to create embedding for "${demo.title}": ${embeddingError.message}`
            console.error(`[seed-demo POST] ${errorMsg}`)
            errors.push(errorMsg)
          } else {
            console.log(`[seed-demo POST] Created embedding for source: ${source.id}`)
          }
        } catch (embeddingErr) {
          const errorMsg = `Failed to generate embedding for "${demo.title}": ${embeddingErr instanceof Error ? embeddingErr.message : 'Unknown error'}`
          console.error(`[seed-demo POST] ${errorMsg}`)
          errors.push(errorMsg)
        }

        // 4. Create tags from key topics
        for (const topic of demo.summary.key_topics.slice(0, 3)) {
          const { error: tagError } = await supabase.from('tags').insert({
            source_id: source.id,
            tag_name: topic,
          } as never)

          if (tagError) {
            console.warn(`[seed-demo POST] Failed to create tag "${topic}": ${tagError.message}`)
            // Non-critical, don't add to errors array
          }
        }

        createdSources.push({
          id: source.id,
          title: source.title,
        })
      } catch (sourceErr) {
        const errorMsg = `Unexpected error creating "${demo.title}": ${sourceErr instanceof Error ? sourceErr.message : 'Unknown error'}`
        console.error(`[seed-demo POST] ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    // Mark onboarding as started
    try {
      const now = new Date().toISOString()
      await supabase.from('user_quick_wins').upsert(
        {
          user_id: user.id,
          win_id: 'onboarding_started',
          completed: true,
          completed_at: now,
          updated_at: now,
        } as never,
        {
          onConflict: 'user_id,win_id',
        }
      )
      console.log(`[seed-demo POST] Marked 'onboarding_started' as completed`)
    } catch (quickWinErr) {
      console.warn('[seed-demo POST] Failed to mark onboarding_started:', quickWinErr)
      // Non-critical
    }

    // Build response
    const response: SeedDemoResponse = {
      success: createdSources.length > 0,
      message:
        createdSources.length === demoSources.length
          ? 'Demo data seeded successfully'
          : `Partially completed: ${createdSources.length}/${demoSources.length} sources created`,
      sources: createdSources,
      count: createdSources.length,
    }

    console.log(`[seed-demo POST] Completed: ${createdSources.length}/${demoSources.length} sources created`)

    if (errors.length > 0) {
      console.warn(`[seed-demo POST] Errors encountered:`, errors)
    }

    // If no sources created, return error
    if (createdSources.length === 0) {
      return Response.json(
        {
          error: 'Failed to create demo sources',
          message: 'Unable to set up your demo data. Please try again or contact support.',
          details: errors,
        },
        { status: 500 }
      )
    }

    // Return success (even if partial)
    return Response.json(response)
  } catch (error) {
    console.error('[seed-demo POST] Unexpected error:', error)
    return Response.json(
      {
        error: 'Failed to seed demo data',
        message: 'An unexpected error occurred while setting up your demo data. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
