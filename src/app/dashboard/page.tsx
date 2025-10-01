import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/auth/actions'
import ContentIngestion from '@/components/ContentIngestion'
import SourceCard from '@/components/SourceCard'
import Button from '@/components/ui/Button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's sources
  const { data: sources } = await supabase
    .from('sources')
    .select(`
      *,
      summary:summaries(*),
      tags:tags(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Recall Notebook</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <Link href="/search">
                <Button variant="secondary">🔍 Search</Button>
              </Link>
              <form action={signOut}>
                <Button type="submit" variant="ghost">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <ContentIngestion />
          </div>

          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Sources</h2>
              <p className="text-gray-600">
                {sources?.length || 0} {sources?.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>

            {sources && sources.length > 0 ? (
              <div className="grid gap-4">
                {sources.map((source: any) => (
                  <SourceCard key={source.id} source={source} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No sources yet
                </h3>
                <p className="text-gray-600">
                  Add your first piece of content to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
