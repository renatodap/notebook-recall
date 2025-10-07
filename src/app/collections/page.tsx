import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MobileNav from '@/components/MobileNav'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { generateMetadata as generateMeta } from '@/lib/metadata'


export const metadata = generateMeta({
  title: 'Collections',
  description: 'Organize your knowledge into collections. Group related sources together for better organization and discovery.',
  keywords: ['collections', 'organize notes', 'folders', 'knowledge organization'],
  path: '/collections',
  noIndex: true,
})

export default async function CollectionsPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's collections
  const { data: collections } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }) as { data: any[] | null }

  return (
    <>
      <MobileNav />
      <div className="min-h-screen bg-neutral-50 md:ml-64">
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Collections</h1>
              <p className="text-neutral-600 mt-2">
                Organize your sources into collections
              </p>
            </div>
            <Link
              href="/collections/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <Plus className="h-5 w-5" />
              New Collection
            </Link>
          </div>

          {/* Collections Grid */}
          {collections && collections.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.id}`}
                  className="bg-white rounded-lg p-6 border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                        {collection.name}
                      </h3>
                      {collection.description && (
                        <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                          {collection.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-neutral-500 mt-4">
                    <span>{collection.source_count || 0} sources</span>
                    {collection.is_public && (
                      <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                        Public
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                No collections yet
              </h3>
              <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                Collections help you organize related sources together. Create your first collection to get started.
              </p>
              <Link
                href="/collections/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                <Plus className="h-5 w-5" />
                Create Your First Collection
              </Link>
            </div>
          )}
        </main>
      </div>
    </>
  )
}
