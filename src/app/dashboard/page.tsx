import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import ChatSidebar from '@/components/ChatSidebar'
import MobileSidebar from '@/components/MobileSidebar'
import SourcesView from '@/components/SourcesView'
import Link from 'next/link'
import { Sparkles, TrendingUp, FileText } from 'lucide-react'
import { generateMetadata as generateMeta } from '@/lib/metadata'


export const metadata = generateMeta({
  title: 'Dashboard',
  description: 'Your personal knowledge dashboard. View all your saved sources, AI summaries, and recent activity in one place.',
  keywords: ['dashboard', 'knowledge base', 'saved sources', 'recent activity'],
  path: '/dashboard',
  noIndex: true,
})

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
    <div className="flex h-screen" style={{ backgroundColor: 'var(--chat-bg-main)' }}>
      <ChatSidebar />
      <MobileSidebar />

      <div className="flex-1 flex flex-col md:ml-64 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 md:py-12 w-full">
        {/* Personalized Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--chat-text-primary)' }} suppressHydrationWarning>
            {getGreeting()}, {user.user_metadata?.name || user.email?.split('@')[0] || 'there'}
          </h1>
          <p style={{ color: 'var(--chat-text-secondary)' }}>
            {totalSources === 0
              ? "Let's capture your first piece of knowledge"
              : `You have ${totalSources} source${totalSources !== 1 ? 's' : ''} in your knowledge base`
            }
          </p>
        </div>

        {/* Proactive Prompt - Show synthesis suggestion when user has 5+ sources */}
        {canUseSynthesis && (
          <div className="mb-8 rounded-lg p-6" style={{
            backgroundColor: 'var(--chat-bg-message-ai)',
            borderColor: 'var(--chat-border)',
            borderWidth: '1px'
          }}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Sparkles className="h-6 w-6" style={{ color: 'var(--chat-accent)' }} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--chat-text-primary)' }}>
                  Ready to synthesize your knowledge?
                </h3>
                <p className="mb-4" style={{ color: 'var(--chat-text-secondary)' }}>
                  You have {totalSources} sources. AI can now generate comprehensive reports by connecting ideas across your sources.
                </p>
                <Link
                  href="/synthesis"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                  style={{ backgroundColor: 'var(--chat-accent)', color: 'var(--chat-text-primary)' }}
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
            <div className="rounded-lg p-6" style={{
              backgroundColor: 'var(--chat-bg-message-ai)',
              borderColor: 'var(--chat-border)',
              borderWidth: '1px'
            }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--chat-border)' }}>
                  <FileText className="h-5 w-5" style={{ color: 'var(--chat-accent)' }} />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--chat-text-secondary)' }}>Total Sources</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--chat-text-primary)' }}>{totalSources}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg p-6" style={{
              backgroundColor: 'var(--chat-bg-message-ai)',
              borderColor: 'var(--chat-border)',
              borderWidth: '1px'
            }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--chat-border)' }}>
                  <TrendingUp className="h-5 w-5" style={{ color: 'var(--chat-accent)' }} />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--chat-text-secondary)' }}>This Week</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--chat-text-primary)' }} suppressHydrationWarning>
                    {sources?.filter((s: any) => {
                      const weekAgo = new Date()
                      weekAgo.setDate(weekAgo.getDate() - 7)
                      return new Date(s.created_at) > weekAgo
                    }).length || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg p-6" style={{
              backgroundColor: 'var(--chat-bg-message-ai)',
              borderColor: 'var(--chat-border)',
              borderWidth: '1px'
            }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--chat-border)' }}>
                  <Sparkles className="h-5 w-5" style={{ color: 'var(--chat-accent)' }} />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--chat-text-secondary)' }}>AI Summaries</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--chat-text-primary)' }}>
                    {sources?.filter((s: any) => s.summary && (s.summary as any).length > 0).length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--chat-text-primary)' }}>
            {totalSources === 0 ? 'Get Started' : 'Recent Sources'}
          </h2>
          {totalSources > 0 && (
            <Link
              href="/search"
              className="text-sm font-medium transition-colors"
              style={{ color: 'var(--chat-accent)' }}
            >
              Search all sources →
            </Link>
          )}
        </div>

        {/* Sources View */}
        <SourcesView initialSources={sources as any || []} />
        </div>
      </div>
    </div>
  )
}
