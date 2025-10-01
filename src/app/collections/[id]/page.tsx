import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import MobileNav from '@/components/MobileNav'
import CollectionDetailClient from '@/components/collections/CollectionDetailClient'

export const dynamic = 'force-dynamic'

interface CollectionPageProps {
  params: Promise<{ id: string }>
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch collection
  const { data: collection, error: collectionError } = await (supabase as any)
    .from('collections')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (collectionError || !collection) {
    notFound()
  }

  // Fetch sources in this collection using the optimized function
  const { data: sources, error: sourcesError } = await (supabase as any)
    .rpc('get_sources_by_collection', {
      p_user_id: user.id,
      p_collection_id: id,
      p_limit: 100,
      p_offset: 0,
    })

  if (sourcesError) {
    console.error('Error fetching collection sources:', sourcesError)
  }

  // Fetch summaries and tags for the sources
  const sourceIds = sources?.map((s: any) => s.id) || []

  let summaries: any[] = []
  let tags: any[] = []

  if (sourceIds.length > 0) {
    const { data: summariesData } = await supabase
      .from('summaries')
      .select('*')
      .in('source_id', sourceIds)

    const { data: tagsData } = await supabase
      .from('tags')
      .select('*')
      .in('source_id', sourceIds)

    summaries = summariesData || []
    tags = tagsData || []
  }

  // Combine sources with summaries and tags
  const enrichedSources = sources?.map((source: any) => ({
    ...source,
    summary: summaries.filter((s: any) => s.source_id === source.id),
    tags: tags.filter((t: any) => t.source_id === source.id),
  })) || []

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64">
      <MobileNav />

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-12">
        <CollectionDetailClient
          collection={collection}
          initialSources={enrichedSources}
        />
      </div>
    </div>
  )
}
