import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SynthesisReportClient from '@/components/ai/SynthesisReportClient'

export default async function SynthesisReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createServerClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch report with sources
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
    .eq('id', id)
    .single()

  if (error || !report || report.user_id !== user.id) {
    redirect('/synthesis')
  }

  // Transform sources
  const sources = report.synthesis_sources?.map((ss: any) => ss.source) || []

  return (
    <SynthesisReportClient
      report={{
        ...report,
        sources,
        synthesis_sources: undefined,
      }}
    />
  )
}
