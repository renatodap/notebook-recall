import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
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
  available: boolean
}

export default async function ToolsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const availableTools: Tool[] = [
    {
      name: 'AI Assistant',
      description: 'Chat with your knowledge base using AI',
      icon: '💬',
      href: '/chat',
      color: 'bg-blue-500',
      available: true,
    },
  ]

  const comingSoonTools: Tool[] = [
    {
      name: 'Synthesis',
      description: 'Generate research reports & reviews',
      icon: '📝',
      href: '#',
      color: 'bg-purple-500',
      available: false,
    },
    {
      name: 'Knowledge Graph',
      description: 'Visualize connections between sources',
      icon: '🕸️',
      href: '#',
      color: 'bg-green-500',
      available: false,
    },
    {
      name: 'Timeline',
      description: 'Chronological view of your knowledge',
      icon: '📅',
      href: '#',
      color: 'bg-orange-500',
      available: false,
    },
    {
      name: 'Publishing',
      description: 'Create blog posts & academic papers',
      icon: '📄',
      href: '#',
      color: 'bg-pink-500',
      available: false,
    },
    {
      name: 'Analytics',
      description: 'Usage insights & productivity metrics',
      icon: '📊',
      href: '#',
      color: 'bg-yellow-500',
      available: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Tools & Features</h1>
          <p className="text-gray-600">
            Powerful AI-powered tools to analyze, synthesize, and publish your knowledge
          </p>
        </div>

        {/* Available Tools */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Now</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center"
              >
                <div className={`w-16 h-16 ${tool.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <span className="text-3xl">{tool.icon}</span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {tool.name}
                </h3>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {tool.description}
                </p>
                <span className="mt-3 inline-flex items-center text-xs font-medium text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full">
                  ✓ Available
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Coming Soon Tools */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Coming Soon</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {comingSoonTools.map((tool) => (
              <div
                key={tool.name}
                className="bg-white rounded-2xl p-6 border border-gray-200 opacity-60 cursor-not-allowed flex flex-col items-center text-center"
              >
                <div className={`w-16 h-16 ${tool.color} rounded-2xl flex items-center justify-center mb-4`}>
                  <span className="text-3xl">{tool.icon}</span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {tool.name}
                </h3>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {tool.description}
                </p>
                <span className="mt-3 inline-flex items-center text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-indigo-600 mb-1">
              {availableTools.length}
            </div>
            <div className="text-sm text-gray-600">Available Tools</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-400 mb-1">
              {comingSoonTools.length}
            </div>
            <div className="text-sm text-gray-600">Coming Soon</div>
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
          <h3 className="text-xl font-bold mb-2">🚀 Start with AI Assistant</h3>
          <p className="text-indigo-100 mb-4">
            Chat with your knowledge base using our AI Assistant. Ask questions, get summaries, and discover insights from all your sources.
          </p>
          <div className="flex gap-3">
            <Link
              href="/chat"
              className="inline-block bg-white text-indigo-600 font-semibold px-6 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Try AI Assistant →
            </Link>
            <Link
              href="/add"
              className="inline-block bg-indigo-400 text-white font-semibold px-6 py-2 rounded-lg hover:bg-indigo-500 transition-colors"
            >
              Add Sources
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
