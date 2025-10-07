import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { AuthenticationError, NotFoundError, handleAPIError } from '@/lib/errors/custom-errors'

/**
 * DELETE /api/api-keys/[id] - Revoke an API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthenticationError('Please sign in')
    }

    const { id } = await params

    const { error } = await (supabase as any)
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, message: 'API key deleted' })
  } catch (error) {
    return handleAPIError(error)
  }
}
