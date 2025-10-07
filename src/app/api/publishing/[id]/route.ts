import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { ResourceIdParamSchema, UpdatePublishedOutputSchema } from '@/lib/validation/schemas'
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'

// GET: Get published output details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to view published outputs')
    }

    const resolvedParams = await params
    const validation = ResourceIdParamSchema.safeParse(resolvedParams)
    if (!validation.success) {
      throw new ValidationError('Invalid output ID format')
    }

    const { id: outputId } = validation.data

    // Fetch output with linked sources
    const { data: output, error } = await supabase
      .from('published_outputs')
      .select(`
        *,
        output_sources (
          source:sources (
            id,
            title,
            content_type,
            created_at
          )
        )
      `)
      .eq('id', outputId)
      .single()

    if (error) {
      console.error('Fetch output error:', error)
      throw new NotFoundError('Output not found')
    }

    if (!output) {
      throw new NotFoundError('Output not found')
    }

    // Check ownership
    if ((output as any).user_id !== user.id) {
      throw new AuthorizationError('You do not have permission to view this output')
    }

    // Transform sources
    const sources = (output as any).output_sources?.map((os: any) => os.source) || []

    return NextResponse.json({
      output: {
        ...(output as any),
        sources,
        output_sources: undefined,
      },
    })
  } catch (error) {
    console.error('GET output error:', error)
    return handleAPIError(error)
  }
}

// PUT: Update published output
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to update outputs')
    }

    const resolvedParams = await params
    const validation = ResourceIdParamSchema.safeParse(resolvedParams)
    if (!validation.success) {
      throw new ValidationError('Invalid output ID format')
    }

    const { id: outputId } = validation.data

    // Validate request body
    const body = await request.json()
    const bodyValidation = UpdatePublishedOutputSchema.safeParse(body)
    if (!bodyValidation.success) {
      throw new ValidationError(bodyValidation.error.issues[0].message)
    }

    const validatedData = bodyValidation.data

    // Verify ownership
    const { data: output } = await supabase
      .from('published_outputs')
      .select('user_id')
      .eq('id', outputId)
      .single()

    if (!output) {
      throw new NotFoundError('Output not found')
    }

    if ((output as any).user_id !== user.id) {
      throw new AuthorizationError('You do not have permission to update this output')
    }

    // Build updates
    const updates: Record<string, unknown> = {}
    if (validatedData.title !== undefined) updates.title = validatedData.title
    if (validatedData.content !== undefined) updates.content = validatedData.content
    if (validatedData.status !== undefined) updates.status = validatedData.status
    if (validatedData.metadata !== undefined) updates.metadata = validatedData.metadata

    const { data: updated, error } = await supabase
      .from('published_outputs')
      .update(updates as never)
      .eq('id', outputId)
      .select()
      .single()

    if (error) {
      console.error('Update output error:', error)
      throw new Error('Failed to update output')
    }

    return NextResponse.json({ output: updated })
  } catch (error) {
    console.error('PUT output error:', error)
    return handleAPIError(error)
  }
}

// DELETE: Delete published output
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to delete outputs')
    }

    const resolvedParams = await params
    const validation = ResourceIdParamSchema.safeParse(resolvedParams)
    if (!validation.success) {
      throw new ValidationError('Invalid output ID format')
    }

    const { id: outputId } = validation.data

    // Verify ownership
    const { data: output } = await supabase
      .from('published_outputs')
      .select('user_id')
      .eq('id', outputId)
      .single()

    if (!output) {
      throw new NotFoundError('Output not found')
    }

    if ((output as any).user_id !== user.id) {
      throw new AuthorizationError('You do not have permission to delete this output')
    }

    // Delete (will cascade to output_sources)
    const { error } = await supabase
      .from('published_outputs')
      .delete()
      .eq('id', outputId)

    if (error) {
      console.error('Delete output error:', error)
      throw new Error('Failed to delete output')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE output error:', error)
    return handleAPIError(error)
  }
}
