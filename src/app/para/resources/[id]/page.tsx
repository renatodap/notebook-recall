import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import MobileNav from '@/components/MobileNav'
import PARADetailClient from '@/components/para/PARADetailClient'

export const dynamic = 'force-dynamic'

interface ResourcePageProps {
  params: Promise<{ id: string }>
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch resource
  const { data: resource, error: resourceError } = await (supabase as any)
    .from('resources')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (resourceError || !resource) {
    notFound()
  }

  // Fetch sources in this resource
  const { data: resourceSources, error: sourcesError } = await (supabase as any)
    .from('resource_sources')
    .select('source_id')
    .eq('resource_id', id)

  const sourceIds = resourceSources?.map((rs: any) => rs.source_id) || []

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
          item={resource}
          type="resource"
          initialSources={sources}
          icon="💎"
          colorClass="purple"
        />
      </div>
    </div>
  )
}
