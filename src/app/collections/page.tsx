import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Button from '@/components/ui/Button'
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="secondary">← Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CollectionsClient initialCollections={collectionsWithCount} />
      </div>
    </div>
  )
}
