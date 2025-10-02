import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import MobileNav from '@/components/MobileNav'
import PARADetailClient from '@/components/para/PARADetailClient'

export const dynamic = 'force-dynamic'

interface AreaPageProps {
  params: Promise<{ id: string }>
}

export default async function AreaPage({ params }: AreaPageProps) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch area
  const { data: area, error: areaError } = await (supabase as any)
    .from('areas')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (areaError || !area) {
    notFound()
  }

  // Fetch sources in this area
  const { data: areaSources, error: sourcesError } = await (supabase as any)
    .from('area_sources')
    .select('source_id')
    .eq('area_id', id)

  const sourceIds = areaSources?.map((as: any) => as.source_id) || []

  let sources: any[] = []
  if (sourceIds.length > 0) {
    const { data: sourcesData } = await (supabase as any)
      .from('sources')
      .select('*')
      .in('id', sourceIds)
      .eq('user_id', user.id)

    sources = sourcesData || []

    // Fetch summaries and tags
    const { data: summariesData } = await supabase
      .from('summaries')
      .select('*')
      .in('source_id', sourceIds)

    const { data: tagsData } = await supabase
      .from('tags')
      .select('*')
      .in('source_id', sourceIds)

    const summaries = summariesData || []
    const tags = tagsData || []

    // Enrich sources
    sources = sources.map((source: any) => ({
      ...source,
      summary: summaries.filter((s: any) => s.source_id === source.id),
      tags: tags.filter((t: any) => t.source_id === source.id),
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64">
      <MobileNav />

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-12">
        <PARADetailClient
          item={area}
          type="area"
          initialSources={sources}
          icon={area.icon || '🌳'}
          colorClass="green"
        />
      </div>
    </div>
  )
}
