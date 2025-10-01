import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

// GET: List all synthesis reports for current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: reports, error } = await (supabase as any)
      .from('synthesis_reports')
      .select(`
        id,
        title,
        focus,
        report_type,
        executive_summary,
        source_count,
        created_at,
        metadata
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch synthesis reports error:', error)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    return NextResponse.json({
      reports: reports || [],
      total: reports?.length || 0,
    })
  } catch (error) {
    console.error('GET synthesis reports error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
