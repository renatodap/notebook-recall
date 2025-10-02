import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import MobileNav from '@/components/MobileNav'
import SourcesView from '@/components/SourcesView'
import UnifiedDropZone from '@/components/capture/UnifiedDropZone'
import PARADashboard from '@/components/para/PARADashboard'
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
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64">
      <MobileNav />

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-12">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">
              Capture, organize, and recall everything
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/tools"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              🛠️ Tools
            </Link>
          </div>
        </div>

        {/* Unified Drop Zone */}
        <div className="mb-12">
          <UnifiedDropZone />
        </div>

        {/* PARA Organization */}
        <PARADashboard userId={user.id} />

        {/* Sources Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Sources</h2>
        </div>

        {/* Sources View */}
        <SourcesView initialSources={sources || []} />
      </div>
    </div>
  )
}
