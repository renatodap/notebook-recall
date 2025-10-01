import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

// GET: List all published outputs for current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const outputType = searchParams.get('type') // optional filter

    let query = (supabase as any)
      .from('published_outputs')
      .select('id, output_type, title, status, created_at, metadata')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (outputType) {
      query = query.eq('output_type', outputType)
    }

    const { data: outputs, error } = await query

    if (error) {
      console.error('Fetch outputs error:', error)
      return NextResponse.json({ error: 'Failed to fetch outputs' }, { status: 500 })
    }

    return NextResponse.json({
      outputs: outputs || [],
      total: outputs?.length || 0,
    })
  } catch (error) {
    console.error('GET published outputs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
