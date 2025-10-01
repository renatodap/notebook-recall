import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

// GET: List all research questions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: questions, error } = await (supabase as any)
      .from('research_questions')
      .select(`
        *,
        question_sources (
          source:sources (id, title)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch questions error:', error)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    return NextResponse.json({
      questions: questions || [],
      total: questions?.length || 0,
    })
  } catch (error) {
    console.error('GET questions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create research question
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { question_text, category, priority, source_ids } = body

    if (!question_text?.trim()) {
      return NextResponse.json({ error: 'question_text required' }, { status: 400 })
    }

    // Create question
    const { data: question, error: createError } = await (supabase as any)
      .from('research_questions')
      .insert({
        user_id: user.id,
        question_text: question_text.trim(),
        category: category || 'general',
        priority: priority || 'medium',
        status: 'open',
      })
      .select()
      .single()

    if (createError) {
      console.error('Create question error:', createError)
      return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
    }

    // Link sources if provided
    if (source_ids && source_ids.length > 0) {
      const links = source_ids.map((sid: string) => ({
        question_id: question.id,
        source_id: sid,
      }))

      await (supabase as any)
        .from('question_sources')
        .insert(links)
    }

    return NextResponse.json({ question }, { status: 201 })
  } catch (error) {
    console.error('POST question error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
