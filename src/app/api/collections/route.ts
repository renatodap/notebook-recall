import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { createCollectionSchema } from '@/lib/validation/schemas'
import { validateRequestBody } from '@/lib/validation/middleware'
import {
  ValidationError,
  AuthenticationError,
  DatabaseError,
  RateLimitError,
  handleAPIError
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import { DatabaseCollection } from '@/types/api'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { authenticateRequest } from '@/lib/api-auth'

/**
 * GET /api/collections - List all collections for current user
 * Supports both session auth and API key auth
 * @returns Array of collections with source counts
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Support API key auth
    const { userId } = await authenticateRequest(request)

    // Rate limiting - SEARCH limit for GET
    const rateLimit = await checkRateLimit(userId, RATE_LIMITS.SEARCH)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many requests. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const supabase = await createRouteHandlerClient() as TypedSupabaseClient

    const { data: collections, error } = await supabase
      .from('collections')
      .select(`
        *,
        sources:collection_sources(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch collections error:', error)
      throw new DatabaseError('Failed to retrieve collections. Please try again')
    }

    // Transform to include source count
    const collectionsWithCount = collections?.map((c: any) => ({
      ...c,
      source_count: c.sources?.[0]?.count || 0,
      sources: undefined,
    })) || []

    return NextResponse.json({
      success: true,
      data: collectionsWithCount,
    })
  } catch (error) {
    return handleAPIError(error)
  }
}

/**
 * POST /api/collections - Create new collection
 * @body CreateCollectionSchema - Collection data
 * @returns Created collection object
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to create a collection')
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
    const validatedData = await validateRequestBody(request, createCollectionSchema)
    const { name, description, is_public, collection_type, source_ids, metadata } = validatedData

    // Create collection
    const { data: collection, error: createError } = await supabase
      .from('collections')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        is_public: is_public || false,
        collection_type: collection_type || 'reading_list',
        metadata: metadata || null,
      } as never)
      .select()
      .single()

    if (createError || !collection) {
      console.error('Create collection error:', createError)
      throw new DatabaseError('Failed to create collection. Please try again')
    }

    // Add sources if provided
    if (source_ids && source_ids.length > 0) {
      const sourceLinks = source_ids.map(sid => ({
        collection_id: (collection as any).id,
        source_id: sid,
        added_by: user.id,
      }))

      const { error: linkError } = await supabase
        .from('collection_sources')
        .insert(sourceLinks as never)

      if (linkError) {
        console.error('Link sources error:', linkError)
        // Continue anyway, collection is created
      }
    }

    return NextResponse.json({ collection }, { status: 201 })
  } catch (error) {
    return handleAPIError(error)
  }
}
