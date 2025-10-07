import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { ResourceIdParamSchema } from '@/lib/validation/schemas'
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  handleAPIError,
} from '@/lib/errors/custom-errors'
import type { TypedSupabaseClient } from '@/types/supabase-helpers'

// GET: Get synthesis report details with validation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to view synthesis reports')
    }

    const resolvedParams = await params
    const validation = ResourceIdParamSchema.safeParse(resolvedParams)
    if (!validation.success) {
      throw new ValidationError('Invalid synthesis report ID format')
    }

    const { id: reportId } = validation.data

    // Fetch report with linked sources
    const { data: report, error } = await supabase
      .from('synthesis_reports')
      .select(`
        *,
        synthesis_sources (
          source:sources (
            id,
            title,
            content_type,
            created_at
          )
        )
      `)
      .eq('id', reportId)
      .single()

    if (error) {
      console.error('Fetch synthesis report error:', error)
      throw new NotFoundError('Synthesis report not found')
    }

    // Check ownership
    if ((report as any).user_id !== user.id) {
      throw new AuthorizationError('You do not have permission to view this synthesis report')
    }

    // Transform sources
    const sources = (report as any).synthesis_sources?.map((ss: any) => ss.source) || []

    return NextResponse.json({
      report: {
        ...(report as any),
        sources,
        synthesis_sources: undefined,
      },
    })
  } catch (error) {
    console.error('GET synthesis report error:', error)
    return handleAPIError(error)
  }
}

// DELETE: Delete synthesis report with validation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient() as TypedSupabaseClient
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in to delete synthesis reports')
    }

    const resolvedParams = await params
    const validation = ResourceIdParamSchema.safeParse(resolvedParams)
    if (!validation.success) {
      throw new ValidationError('Invalid synthesis report ID format')
    }

    const { id: reportId } = validation.data

    // Verify ownership
    const { data: report } = await supabase
      .from('synthesis_reports')
      .select('user_id')
      .eq('id', reportId)
      .single()

    if (!report) {
      throw new NotFoundError('Synthesis report not found')
    }

    if ((report as any).user_id !== user.id) {
      throw new AuthorizationError('You do not have permission to delete this synthesis report')
    }

    // Delete (will cascade to synthesis_sources)
    const { error } = await supabase
      .from('synthesis_reports')
      .delete()
      .eq('id', reportId)

    if (error) {
      console.error('Delete synthesis report error:', error)
      throw new Error('Failed to delete synthesis report')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE synthesis report error:', error)
    return handleAPIError(error)
  }
}
