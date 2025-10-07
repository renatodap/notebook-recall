import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { UpdateCollectionSchema } from '@/lib/validation/schemas'
import { validateRequestBody, validatePathParams } from '@/lib/validation/middleware'
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  RateLimitError,
  handleAPIError
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'
import { z } from 'zod'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { authenticateRequest } from '@/lib/api-auth'

const PathParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid collection ID format' }),
})

/**
 * GET /api/collections/[id] - Get collection details
 * Supports both session auth and API key auth
 * @param params.id - Collection UUID
 * @returns Collection details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

    const resolvedParams = await params
    const { id: collectionId } = validatePathParams(resolvedParams, PathParamsSchema)

    // Fetch collection with sources
    const { data: collection, error } = await supabase
      .from('collections')
      .select(`
        *,
        collection_sources (
          source_id,
          note,
          added_at,
          source:sources (
            id,
            title,
            content_type,
            created_at,
            summaries (summary_text),
            tags (tag_name)
          )
        )
      `)
      .eq('id', collectionId)
      .single()

    if (error) {
      console.error('Fetch collection error:', error)
      throw new NotFoundError('Collection not found')
    }

    if (!collection) {
      throw new NotFoundError('Collection not found')
    }

    // Check access
    if ((collection as any).user_id !== userId && !(collection as any).is_public) {
      throw new AuthorizationError('You do not have permission to view this collection')
    }

    // Transform sources
    const sources = (collection as any).collection_sources?.map((cs: any) => ({
      ...cs.source,
      note: cs.note,
      added_at: cs.added_at,
    })) || []

    return NextResponse.json({
      success: true,
      data: {
        ...(collection as any),
        sources,
        collection_sources: undefined,
      },
    })
  } catch (error) {
    return handleAPIError(error)
  }
}

/**
 * PUT /api/collections/[id] - Update collection
 * @param params.id - Collection UUID
 * @body UpdateCollectionSchema - Updates to apply
 * @returns Updated collection
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to update collections')
    }

    const userId = user.id

    // Rate limiting - DATA_MODIFICATION limit for PUT
    const rateLimitPut = await checkRateLimit(userId, RATE_LIMITS.DATA_MODIFICATION)
    if (rateLimitPut.isLimited) {
      throw new RateLimitError(
        `Too many modifications. Please try again in ${rateLimitPut.retryAfter} seconds`,
        rateLimitPut.retryAfter
      )
    }

    const resolvedParams = await params
    const { id: collectionId } = validatePathParams(resolvedParams, PathParamsSchema)

    // Validate request body
    const validatedData = await validateRequestBody(request, UpdateCollectionSchema)

    // Verify ownership
    const { data: collection, error: fetchError } = await supabase
      .from('collections')
      .select('user_id')
      .eq('id', collectionId)
      .single()

    if (fetchError || !collection) {
      throw new NotFoundError('Collection not found')
    }

    if ((collection as any).user_id !== userId) {
      throw new AuthorizationError('You do not have permission to update this collection')
    }

    // Build updates object
    const updates: Record<string, unknown> = {}
    if (validatedData.name !== undefined) updates.name = validatedData.name
    if (validatedData.description !== undefined) updates.description = validatedData.description
    if (validatedData.is_public !== undefined) updates.is_public = validatedData.is_public
    if (validatedData.collection_type !== undefined) updates.collection_type = validatedData.collection_type
    if (validatedData.metadata !== undefined) updates.metadata = validatedData.metadata

    // Update collection
    const { data: updated, error } = await supabase
      .from('collections')
      .update(updates as never)
      .eq('id', collectionId)
      .select()
      .single()

    if (error) {
      console.error('Update collection error:', error)
      throw new DatabaseError('Failed to update collection. Please try again')
    }

    return NextResponse.json({ collection: updated })
  } catch (error) {
    return handleAPIError(error)
  }
}

/**
 * DELETE /api/collections/[id] - Delete collection
 * @param params.id - Collection UUID
 * @returns Success status
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to delete collections')
    }

    const userId = user.id

    // Rate limiting - DATA_MODIFICATION limit for DELETE
    const rateLimitDel = await checkRateLimit(userId, RATE_LIMITS.DATA_MODIFICATION)
    if (rateLimitDel.isLimited) {
      throw new RateLimitError(
        `Too many modifications. Please try again in ${rateLimitDel.retryAfter} seconds`,
        rateLimitDel.retryAfter
      )
    }

    const resolvedParams = await params
    const { id: collectionId } = validatePathParams(resolvedParams, PathParamsSchema)

    // Verify ownership
    const { data: collection, error: fetchError } = await supabase
      .from('collections')
      .select('user_id')
      .eq('id', collectionId)
      .single()

    if (fetchError || !collection) {
      throw new NotFoundError('Collection not found')
    }

    if ((collection as any).user_id !== userId) {
      throw new AuthorizationError('You do not have permission to delete this collection')
    }

    // Delete (will cascade to collection_sources)
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', collectionId)

    if (error) {
      console.error('Delete collection error:', error)
      throw new DatabaseError('Failed to delete collection. Please try again')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAPIError(error)
  }
}
