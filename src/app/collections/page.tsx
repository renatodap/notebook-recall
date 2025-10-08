import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatSidebar from '@/components/ChatSidebar'
import MobileSidebar from '@/components/MobileSidebar'
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
    <div className="flex h-screen" style={{ backgroundColor: 'var(--chat-bg-main)' }}>
      <ChatSidebar />
      <MobileSidebar />

      <div className="flex-1 flex flex-col md:ml-64 overflow-y-auto">
        <main className="max-w-7xl mx-auto px-6 py-8 w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--chat-text-primary)' }}>Collections</h1>
              <p className="mt-2" style={{ color: 'var(--chat-text-secondary)' }}>
                Organize your sources into collections
              </p>
            </div>
            <Link
              href="/collections/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium"
              style={{
                backgroundColor: 'var(--chat-accent)',
                color: 'var(--chat-text-primary)'
              }}
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
                  className="rounded-lg p-6 border transition-all duration-200 group"
                  style={{
                    backgroundColor: 'var(--chat-bg-message-ai)',
                    borderColor: 'var(--chat-border)'
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold transition-colors group-hover:opacity-80"
                          style={{ color: 'var(--chat-text-primary)' }}>
                        {collection.name}
                      </h3>
                      {collection.description && (
                        <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--chat-text-secondary)' }}>
                          {collection.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm mt-4" style={{ color: 'var(--chat-text-secondary)' }}>
                    <span>{collection.source_count || 0} sources</span>
                    {collection.is_public && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: 'rgba(16, 163, 127, 0.1)',
                              color: 'var(--chat-accent)'
                            }}>
                        Public
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border p-12 text-center"
                 style={{
                   backgroundColor: 'var(--chat-bg-message-ai)',
                   borderColor: 'var(--chat-border)'
                 }}>
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--chat-text-primary)' }}>
                No collections yet
              </h3>
              <p className="mb-6 max-w-md mx-auto" style={{ color: 'var(--chat-text-secondary)' }}>
                Collections help you organize related sources together. Create your first collection to get started.
              </p>
              <Link
                href="/collections/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-colors font-medium"
                style={{
                  backgroundColor: 'var(--chat-accent)',
                  color: 'var(--chat-text-primary)'
                }}
              >
                <Plus className="h-5 w-5" />
                Create Your First Collection
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
