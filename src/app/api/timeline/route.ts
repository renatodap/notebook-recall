import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

// GET: Get timeline of sources
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupBy = searchParams.get('group_by') || 'month' // day, week, month, year

    // Fetch all sources with timestamps
    const { data: sources, error } = await (supabase as any)
      .from('sources')
      .select('id, title, content_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Fetch sources error:', error)
      return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 })
    }

    // Group sources by time period
    const timeline: Record<string, any[]> = {}

    sources?.forEach((source: any) => {
      const date = new Date(source.created_at)
      let key: string

      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0]
          break
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        case 'year':
          key = String(date.getFullYear())
          break
        default:
          key = date.toISOString().split('T')[0]
      }

      if (!timeline[key]) {
        timeline[key] = []
      }

      timeline[key].push(source)
    })

    // Convert to array and sort
    const timelineArray = Object.entries(timeline).map(([period, sources]) => ({
      period,
      count: sources.length,
      sources,
    })).sort((a, b) => a.period.localeCompare(b.period))

    return NextResponse.json({
      timeline: timelineArray,
      total_periods: timelineArray.length,
      total_sources: sources?.length || 0,
      group_by: groupBy,
    })
  } catch (error) {
    console.error('GET timeline error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
