import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import MobileNav from '@/components/MobileNav'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ToolsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const tools = [
    {
      name: 'AI Assistant',
      description: 'Chat with your knowledge base',
      icon: '💬',
      href: '/chat',
      color: 'bg-blue-500',
      available: true,
    },
    {
      name: 'Synthesis',
      description: 'Generate research reports & reviews',
      icon: '📝',
      href: '/synthesis',
      color: 'bg-purple-500',
      available: false,
    },
    {
      name: 'Knowledge Graph',
      description: 'Visualize connections',
      icon: '🕸️',
      href: '/graph',
      color: 'bg-green-500',
      available: false,
    },
    {
      name: 'Timeline',
      description: 'Chronological view',
      icon: '📅',
      href: '/timeline',
      color: 'bg-orange-500',
      available: false,
    },
    {
      name: 'Publishing',
      description: 'Create blog posts & papers',
      icon: '📄',
      href: '/publishing',
      color: 'bg-pink-500',
      available: false,
    },
    {
      name: 'Analytics',
      description: 'Usage insights & productivity',
      icon: '📊',
      href: '/analytics',
      color: 'bg-yellow-500',
      available: false,
    },
    {
      name: 'Import',
      description: 'Bulk import references',
      icon: '📥',
      href: '/import',
      color: 'bg-cyan-500',
      available: false,
    },
    {
      name: 'Search',
      description: 'Semantic & keyword search',
      icon: '🔍',
      href: '/search',
      color: 'bg-gray-500',
      available: false,
    },
    {
      name: 'Workspaces',
      description: 'Team collaboration',
      icon: '👥',
      href: '/workspaces',
      color: 'bg-violet-500',
      available: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64">
      <MobileNav />

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Tools & Features</h1>
          <p className="text-gray-600">
            Powerful AI-powered tools to analyze, synthesize, and publish your knowledge
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tools.map((tool) => {
            const CardWrapper = tool.available ? Link : 'div'
            const cardProps = tool.available ? { href: tool.href } : {}

            return (
              <CardWrapper
                key={tool.href}
                {...cardProps}
                className={`group bg-white rounded-2xl p-6 border border-gray-200 flex flex-col items-center text-center ${
                  tool.available
                    ? 'hover:border-indigo-300 hover:shadow-lg cursor-pointer'
                    : 'opacity-40 cursor-not-allowed'
                } transition-all duration-200`}
              >
                <div className={`w-16 h-16 ${tool.color} rounded-2xl flex items-center justify-center mb-4 ${tool.available ? 'group-hover:scale-110' : ''} transition-transform duration-200`}>
                  <span className="text-3xl">{tool.icon}</span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {tool.name}
                </h3>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {tool.description}
                </p>
              </CardWrapper>
            )
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-indigo-600 mb-1">{tools.length}</div>
            <div className="text-sm text-gray-600">AI Tools</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-green-600 mb-1">∞</div>
            <div className="text-sm text-gray-600">Possibilities</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-purple-600 mb-1">Claude</div>
            <div className="text-sm text-gray-600">Powered by</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-orange-600 mb-1">24/7</div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
          <h3 className="text-xl font-bold mb-2">🚀 New to these tools?</h3>
          <p className="text-indigo-100 mb-4">
            Each tool is designed to help you work smarter with your knowledge. Start with the AI Assistant to chat with your sources, or try Synthesis to generate comprehensive reports.
          </p>
          <Link
            href="/add"
            className="inline-block bg-white text-indigo-600 font-semibold px-6 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Add Your First Source →
          </Link>
        </div>
      </div>
    </div>
  )
}
