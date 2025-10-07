import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import MobileNav from '@/components/MobileNav'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AI Tools - Recall Notebook',
  description: 'Access powerful AI tools for your knowledge base: chat assistant, synthesis, knowledge graphs, and more',
}

interface Tool {
  name: string
  description: string
  icon: string
  href: string
  color: string
  category: 'core' | 'academic' | 'social'
}

export default async function ToolsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user stats for recommendations
  const { data: sources } = await supabase
    .from('sources')
    .select('id')
    .eq('user_id', user.id)

  const sourceCount = sources?.length || 0

  const coreTools: Tool[] = [
    {
      name: 'AI Assistant',
      description: 'Chat with your knowledge base using AI',
      icon: '💬',
      href: '/chat',
      color: 'bg-blue-500',
      category: 'core',
    },
    {
      name: 'Synthesis Reports',
      description: 'Generate comprehensive research reports from multiple sources',
      icon: '📝',
      href: '/synthesis',
      color: 'bg-purple-500',
      category: 'core',
    },
    {
      name: 'Knowledge Graph',
      description: 'Visualize connections between your sources',
      icon: '🕸️',
      href: '/graph',
      color: 'bg-green-500',
      category: 'core',
    },
    {
      name: 'Timeline View',
      description: 'Chronological view of your knowledge over time',
      icon: '📅',
      href: '/timeline',
      color: 'bg-orange-500',
      category: 'core',
    },
    {
      name: 'Analytics',
      description: 'Usage insights and productivity metrics',
      icon: '📊',
      href: '/analytics',
      color: 'bg-yellow-500',
      category: 'core',
    },
  ]

  const academicTools: Tool[] = [
    {
      name: 'Literature Review',
      description: 'Generate structured literature reviews with templates',
      icon: '📚',
      href: '/literature-review',
      color: 'bg-indigo-500',
      category: 'academic',
    },
    {
      name: 'Methodology Comparison',
      description: 'Compare research methodologies across sources',
      icon: '🔬',
      href: '/methodology',
      color: 'bg-teal-500',
      category: 'academic',
    },
    {
      name: 'Research Questions',
      description: 'Track research questions and link to sources',
      icon: '❓',
      href: '/research-questions',
      color: 'bg-pink-500',
      category: 'academic',
    },
    {
      name: 'Import References',
      description: 'Bulk import from BibTeX, RIS, or other formats',
      icon: '📥',
      href: '/import',
      color: 'bg-cyan-500',
      category: 'academic',
    },
  ]

  const socialTools: Tool[] = [
    {
      name: 'Discover Researchers',
      description: 'Connect with fellow academics and researchers',
      icon: '🔍',
      href: '/discover',
      color: 'bg-rose-500',
      category: 'social',
    },
    {
      name: 'Workspaces',
      description: 'Collaborate with teams on shared knowledge bases',
      icon: '👥',
      href: '/workspaces',
      color: 'bg-violet-500',
      category: 'social',
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 md:pb-0 md:pl-64">
      <MobileNav />

      <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-neutral-900 tracking-tight mb-3">
            AI Tools & Features
          </h1>
          <p className="text-lg text-neutral-600">
            Powerful AI-powered tools to analyze, synthesize, and publish your knowledge
          </p>
        </div>

        {/* Recommendation Card */}
        {sourceCount >= 5 && (
          <div className="mb-10 bg-gradient-to-r from-primary-500 to-purple-600 rounded-2xl p-6 text-white">
            <h3 className="text-xl font-bold mb-2">🚀 Recommended: Generate a Synthesis Report</h3>
            <p className="text-primary-100 mb-4">
              You have {sourceCount} sources. AI can now generate comprehensive reports by connecting ideas across your knowledge base.
            </p>
            <Link
              href="/synthesis"
              className="inline-block bg-white text-primary-600 font-semibold px-6 py-3 rounded-lg hover:bg-primary-50 transition-colors shadow-lg"
            >
              Generate Synthesis Report →
            </Link>
          </div>
        )}

        {/* Core Tools */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-5 flex items-center gap-2">
            <span>⚡</span> Core AI Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {coreTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group bg-white rounded-2xl p-6 border border-neutral-200 hover:border-primary-300 hover:shadow-xl transition-all duration-200"
              >
                <div className={`w-16 h-16 ${tool.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg`}>
                  <span className="text-3xl">{tool.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {tool.name}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {tool.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Academic Tools */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-5 flex items-center gap-2">
            <span>🎓</span> Academic Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {academicTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group bg-white rounded-2xl p-6 border border-neutral-200 hover:border-primary-300 hover:shadow-xl transition-all duration-200"
              >
                <div className={`w-14 h-14 ${tool.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 shadow-md`}>
                  <span className="text-2xl">{tool.icon}</span>
                </div>
                <h3 className="text-base font-semibold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {tool.name}
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {tool.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Social & Collaboration Tools */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-5 flex items-center gap-2">
            <span>🤝</span> Social & Collaboration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {socialTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group bg-white rounded-2xl p-6 border border-neutral-200 hover:border-primary-300 hover:shadow-xl transition-all duration-200"
              >
                <div className={`w-16 h-16 ${tool.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg`}>
                  <span className="text-3xl">{tool.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {tool.name}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {tool.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats Footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-neutral-200">
          <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm">
            <div className="text-3xl font-bold text-primary-600 mb-1">
              {coreTools.length + academicTools.length + socialTools.length}
            </div>
            <div className="text-sm text-neutral-600">Total Tools</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm">
            <div className="text-3xl font-bold text-purple-600 mb-1">Claude</div>
            <div className="text-sm text-neutral-600">Powered by</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm">
            <div className="text-3xl font-bold text-green-600 mb-1">{sourceCount}</div>
            <div className="text-sm text-neutral-600">Your Sources</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm">
            <div className="text-3xl font-bold text-orange-600 mb-1">24/7</div>
            <div className="text-sm text-neutral-600">Available</div>
          </div>
        </div>
      </div>
    </div>
  )
}
