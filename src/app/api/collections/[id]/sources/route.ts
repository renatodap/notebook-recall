import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { AddToCollectionSchema, UUIDSchema } from '@/lib/validation/schemas'
import { validateRequestBody, validatePathParams, validateQueryParams } from '@/lib/validation/middleware'
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  RateLimitError,
  handleAPIError
} from '@/lib/errors/custom-errors'
import { z } from 'zod'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { authenticateRequest } from '@/lib/api-auth'

const PathParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid collection ID format' }),
})

const DeleteQuerySchema = z.object({
  source_id: UUIDSchema,
})

/**
 * GET /api/collections/[id]/sources - Get all sources in a collection
 * Supports both session auth and API key auth
 * @param params.id - Collection UUID
 * @returns Array of sources with summaries and tags
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

    const supabase = await createRouteHandlerClient()

    const resolvedParams = await params
    const { id: collectionId } = validatePathParams(resolvedParams, PathParamsSchema)

    // Verify collection exists and user has access
    const { data: collection, error: collectionError } = await (supabase as any)
      .from('collections')
      .select('user_id, is_public')
      .eq('id', collectionId)
      .single()

    if (collectionError || !collection) {
      throw new NotFoundError('Collection not found')
    }

    // Check access - user must own collection or it must be public
    if (collection.user_id !== userId && !collection.is_public) {
      throw new AuthorizationError('You do not have permission to view this collection')
    }

    // Fetch sources with related data
    const { data: sources, error } = await (supabase as any)
      .from('collection_sources')
      .select(`
        source_id,
        note,
        added_at,
        source:sources (
          id,
          title,
          content_type,
          url,
          created_at,
          summaries (
            id,
            summary_text,
            created_at
          ),
          tags (
            id,
            tag_name
          )
        )
      `)
      .eq('collection_id', collectionId)
      .order('added_at', { ascending: false })

    if (error) {
      console.error('Fetch collection sources error:', error)
      throw new DatabaseError('Failed to retrieve collection sources. Please try again')
    }

    // Transform to flatten source data
    const transformedSources = sources?.map((cs: any) => ({
      ...cs.source,
      note: cs.note,
      added_at: cs.added_at,
    })) || []

    return NextResponse.json({
      success: true,
      data: transformedSources,
    })
  } catch (error) {
    return handleAPIError(error)
  }
}

/**
 * POST /api/collections/[id]/sources - Add source to collection
 * @param params.id - Collection UUID
 * @body AddToCollectionSchema - Source to add
 * @returns Created link
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to add sources to collections')
    }

    // Rate limiting - DATA_MODIFICATION limit for POST
    const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.DATA_MODIFICATION)
    if (rateLimit.isLimited) {
      throw new RateLimitError(
        `Too many modifications. Please try again in ${rateLimit.retryAfter} seconds`,
        rateLimit.retryAfter
      )
    }

    const resolvedParams = await params
    const { id: collectionId } = validatePathParams(resolvedParams, PathParamsSchema)

    // Validate request body
    const validatedData = await validateRequestBody(request, AddToCollectionSchema)
    const { source_id, note } = validatedData

    // Verify collection ownership
    const { data: collection } = await (supabase as any)
      .from('collections')
      .select('user_id')
      .eq('id', collectionId)
      .single()

    if (!collection) {
      throw new NotFoundError('Collection not found')
    }

    if (collection.user_id !== user.id) {
      throw new AuthorizationError('You do not have permission to modify this collection')
    }

    // Verify source ownership
    const { data: source } = await (supabase as any)
      .from('sources')
      .select('id')
      .eq('id', source_id)
      .eq('user_id', user.id as never)
      .single()

    if (!source) {
      throw new NotFoundError('Source not found or you do not have permission to access it')
    }

    // Check if already in collection
    const { data: existing } = await (supabase as any)
      .from('collection_sources')
      .select('*')
      .eq('collection_id', collectionId)
      .eq('source_id', source_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'This source is already in the collection' },
        { status: 409 }
      )
    }

    // Add to collection
    const { data: link, error } = await (supabase as any)
      .from('collection_sources')
      .insert({
        collection_id: collectionId,
        source_id,
        added_by: user.id,
        note: note || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Add source error:', error)
      throw new DatabaseError('Failed to add source to collection. Please try again')
    }

    return NextResponse.json({ link }, { status: 201 })
  } catch (error) {
    return handleAPIError(error)
  }
}

/**
 * DELETE /api/collections/[id]/sources - Remove source from collection
 * @param params.id - Collection UUID
 * @query source_id - Source UUID to remove
 * @returns Success status
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to remove sources from collections')
    }

    // Rate limiting - DATA_MODIFICATION limit for DELETE
    const rateLimitDel = await checkRateLimit(user.id, RATE_LIMITS.DATA_MODIFICATION)
    if (rateLimitDel.isLimited) {
      throw new RateLimitError(
        `Too many modifications. Please try again in ${rateLimitDel.retryAfter} seconds`,
        rateLimitDel.retryAfter
      )
    }

    const resolvedParams = await params
    const { id: collectionId } = validatePathParams(resolvedParams, PathParamsSchema)

    // Validate query params
    const { source_id: sourceId } = validateQueryParams(request, DeleteQuerySchema)

    // Verify collection ownership
    const { data: collection } = await (supabase as any)
      .from('collections')
      .select('user_id')
      .eq('id', collectionId)
      .single()

    if (!collection) {
      throw new NotFoundError('Collection not found')
    }

    if (collection.user_id !== user.id) {
      throw new AuthorizationError('You do not have permission to modify this collection')
    }

    // Remove from collection
    const { error } = await (supabase as any)
      .from('collection_sources')
      .delete()
      .eq('collection_id', collectionId)
      .eq('source_id', sourceId)

    if (error) {
      console.error('Remove source error:', error)
      throw new DatabaseError('Failed to remove source from collection. Please try again')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAPIError(error)
  }
}
