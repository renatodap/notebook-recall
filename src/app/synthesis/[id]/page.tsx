import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import SynthesisReportClient from '@/components/ai/SynthesisReportClient'
import { generateMetadata as generateMeta } from '@/lib/metadata'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: report } = await (supabase as any)
    .from('synthesis_reports')
    .select('title')
    .eq('id', id)
    .single()

  if (!report) {
    return generateMeta({
      title: 'Synthesis Report Not Found',
      description: 'The requested synthesis report could not be found.',
      path: '/synthesis',
      noIndex: true,
    })
  }

  return generateMeta({
    title: report.title || 'Synthesis Report',
    description: 'AI-generated synthesis report connecting ideas across your sources. Discover patterns, themes, and insights.',
    keywords: ['synthesis report', 'AI analysis', 'knowledge synthesis', 'research insights'],
    path: `/synthesis/${id}`,
    noIndex: true,
  })
}

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
