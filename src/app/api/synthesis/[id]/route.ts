import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'

// GET: Get synthesis report details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: reportId } = await params

    // Fetch report with linked sources
    const { data: report, error } = await (supabase as any)
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
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Check ownership
    if (report.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Transform sources
    const sources = report.synthesis_sources?.map((ss: any) => ss.source) || []

    return NextResponse.json({
      report: {
        ...report,
        sources,
        synthesis_sources: undefined,
      },
    })
  } catch (error) {
    console.error('GET synthesis report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete synthesis report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: reportId } = await params

    // Verify ownership
    const { data: report } = await (supabase as any)
      .from('synthesis_reports')
      .select('user_id')
      .eq('id', reportId)
      .single()

    if (!report || report.user_id !== user.id) {
      return NextResponse.json({ error: 'Report not found or access denied' }, { status: 404 })
    }

    // Delete (will cascade to synthesis_sources)
    const { error } = await (supabase as any)
      .from('synthesis_reports')
      .delete()
      .eq('id', reportId)

    if (error) {
      console.error('Delete synthesis report error:', error)
      return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE synthesis report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
