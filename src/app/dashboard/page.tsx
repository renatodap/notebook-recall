import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/auth/actions'
import ContentIngestion from '@/components/ContentIngestion'
import DashboardClient from '@/components/DashboardClient'
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Recall Notebook</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <Link href="/collections">
                <Button variant="secondary">📚 Collections</Button>
              </Link>
              <Link href="/synthesis">
                <Button variant="secondary">📝 Synthesis</Button>
              </Link>
              <Link href="/graph">
                <Button variant="secondary">🕸️ Graph</Button>
              </Link>
              <Link href="/chat">
                <Button variant="secondary">💬 Assistant</Button>
              </Link>
              <Link href="/publishing">
                <Button variant="secondary">📄 Publish</Button>
              </Link>
              <Link href="/analytics">
                <Button variant="secondary">📊 Analytics</Button>
              </Link>
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
            <DashboardClient initialSources={sources || []} />
          </div>
        </div>
      </div>
    </div>
  )
}
