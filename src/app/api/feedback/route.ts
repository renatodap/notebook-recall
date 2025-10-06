import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

/**
 * Feature 8: Record user feedback for adaptive learning
 * POST /api/feedback
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message_id, was_helpful, rating, feedback_text } = body

    if (!message_id) {
      return NextResponse.json({ error: 'message_id required' }, { status: 400 })
    }

    // Record feedback
    const { data, error } = await supabase
      .from('message_feedback')
      .insert({
        message_id,
        user_id: user.id,
        rating: rating || (was_helpful ? 5 : 2),
        was_helpful: was_helpful ?? true,
        feedback_text,
        timestamp: new Date().toISOString()
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Feedback recording error:', error)
      return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true, feedback_id: (data as any)?.id })
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
