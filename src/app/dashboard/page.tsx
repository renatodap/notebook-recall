import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import MobileNav from '@/components/MobileNav'
import SourcesView from '@/components/SourcesView'
import Link from 'next/link'
import { Sparkles, TrendingUp, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

// Time-aware greeting
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

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
    .eq('user_id' as never, user.id)
    .order('created_at', { ascending: false })

  // Get stats
  const totalSources = sources?.length || 0

  // Check if user has enough sources for synthesis
  const canUseSynthesis = totalSources >= 5

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 md:pb-0 md:pl-64">
      <MobileNav />

      <div className="max-w-6xl mx-auto px-6 py-8 md:py-12">
        {/* Personalized Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight mb-2">
            {getGreeting()}, {user.user_metadata?.name || user.email?.split('@')[0] || 'there'}
          </h1>
          <p className="text-neutral-600">
            {totalSources === 0
              ? "Let's capture your first piece of knowledge"
              : `You have ${totalSources} source${totalSources !== 1 ? 's' : ''} in your knowledge base`
            }
          </p>
        </div>

        {/* Proactive Prompt - Show synthesis suggestion when user has 5+ sources */}
        {canUseSynthesis && (
          <div className="mb-8 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Sparkles className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                  Ready to synthesize your knowledge?
                </h3>
                <p className="text-neutral-600 mb-4">
                  You have {totalSources} sources. AI can now generate comprehensive reports by connecting ideas across your sources.
                </p>
                <Link
                  href="/synthesis"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
                >
                  <TrendingUp className="h-4 w-4" />
                  Generate Synthesis Report
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {totalSources > 0 && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <FileText className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Total Sources</p>
                  <p className="text-2xl font-bold text-neutral-900">{totalSources}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-success-700" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">This Week</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {sources?.filter((s: any) => {
                      const weekAgo = new Date()
                      weekAgo.setDate(weekAgo.getDate() - 7)
                      return new Date(s.created_at) > weekAgo
                    }).length || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <Sparkles className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">AI Summaries</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {sources?.filter((s: any) => s.summary && (s.summary as any).length > 0).length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-neutral-900">
            {totalSources === 0 ? 'Get Started' : 'Recent Sources'}
          </h2>
          {totalSources > 0 && (
            <Link
              href="/search"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Search all sources →
            </Link>
          )}
        </div>

        {/* Sources View */}
        <SourcesView initialSources={sources as any || []} />
      </div>
    </div>
  )
}
