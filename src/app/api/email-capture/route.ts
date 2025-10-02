import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Parse email content
    const body = await request.json()
    const { from, subject, body: emailBody, user_email } = body

    // Find user by capture email
    const { data: userPref } = await (supabase as any)
      .from('user_preferences')
      .select('user_id')
      .eq('capture_email', user_email)
      .single()

    if (!userPref) {
      return NextResponse.json({ error: 'Invalid capture email' }, { status: 404 })
    }

    // Save email capture
    const { data: capture, error: captureError } = await (supabase as any)
      .from('email_captures')
      .insert({
        user_id: userPref.user_id,
        email_from: from,
        email_subject: subject,
        email_body: emailBody,
        metadata: {
          received_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (captureError) {
      console.error('Capture error:', captureError)
      return NextResponse.json({ error: 'Failed to save capture' }, { status: 500 })
    }

    // Create source from email
    const title = subject || `Email from ${from}`
    const { data: source } = await (supabase as any)
      .from('sources')
      .insert({
        user_id: userPref.user_id,
        title,
        content_type: 'email',
        original_content: emailBody,
        url: from,
        metadata: {
          from,
          subject,
          captured_via: 'email'
        }
      })
      .select()
      .single()

    // Update capture with source_id
    await (supabase as any)
      .from('email_captures')
      .update({ source_id: source.id, processed: true })
      .eq('id', capture.id)

    // Auto-summarize
    try {
      await fetch(`${request.nextUrl.origin}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_id: source.id })
      })
    } catch (err) {
      console.error('Summarization error:', err)
    }

    return NextResponse.json({ success: true, source_id: source.id }, { status: 201 })

  } catch (error) {
    console.error('Email capture error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint to retrieve user's capture email
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: pref } = await (supabase as any)
      .from('user_preferences')
      .select('capture_email')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ capture_email: pref?.capture_email || null })

  } catch (error) {
    console.error('Get capture email error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
