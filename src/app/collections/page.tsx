import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import MobileNav from '@/components/MobileNav'
import CollectionsClient from '@/components/collections/CollectionsClient'

export const dynamic = 'force-dynamic'

export default async function CollectionsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: collections } = await (supabase as any)
    .from('collections')
    .select(`
      *,
      sources:collection_sources(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const collectionsWithCount = collections?.map((c: any) => ({
    ...c,
    source_count: c.sources?.[0]?.count || 0,
    sources: undefined,
  })) || []

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64">
      <MobileNav />

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-12">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Collections</h1>
          <p className="text-gray-600">
            Organize your sources into projects and topics
          </p>
        </div>

        {/* Collections */}
        <CollectionsClient initialCollections={collectionsWithCount} />
      </div>
    </div>
  )
}
