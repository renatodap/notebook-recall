import { createServerClient } from '@/lib/supabase/server'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export const dynamic = 'force-dynamic'

interface PublicSourcePageProps {
  params: Promise<{ id: string }>
}

export default async function PublicSourcePage({ params }: PublicSourcePageProps) {
  const { id } = await params
  const supabase = await createServerClient()

  // Check if source is publicly shared
  const { data: shareInfo } = await (supabase as any)
    .from('source_shares')
    .select('*, sources (*, summaries (*), tags (*))')
    .eq('source_id', id)
    .eq('visibility', 'public')
    .single()

  if (!shareInfo || !shareInfo.sources) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Source Not Found</h1>
          <p className="text-gray-600 mb-6">
            This source is either private or doesn&apos;t exist.
          </p>
          <Link href="/">
            <Button>← Back to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const source = shareInfo.sources
  const summary = source.summaries?.[0]
  const tags = source.tags || []

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex-1 min-w-0">
              <Link href="/" className="text-base sm:text-xl font-bold text-indigo-600 hover:text-indigo-700">
                📚 <span className="hidden xs:inline">Recall Notebook</span><span className="xs:hidden">Recall</span>
              </Link>
              <span className="ml-2 sm:ml-3 text-xs sm:text-sm text-gray-500 hidden sm:inline">Public Research</span>
            </div>
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                  <span className="hidden xs:inline">Sign In</span><span className="xs:hidden">Login</span>
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">
                  <span className="hidden sm:inline">Get Started Free</span><span className="sm:hidden">Sign Up</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Source Card */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <div>
                  <div className="inline-block px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full mb-2 sm:mb-3">
                    PUBLIC RESEARCH
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">{source.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <span className="capitalize flex items-center gap-1">
                      <span className="text-base">📄</span>
                      {source.content_type}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span className="text-base">📅</span>
                      {new Date(source.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardBody>
                {source.url && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">Source URL</p>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 text-sm break-all font-medium"
                    >
                      🔗 {source.url}
                    </a>
                  </div>
                )}

                {summary && (
                  <>
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-2xl">🤖</span>
                        AI Summary
                      </h2>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {summary.summary_text}
                      </p>
                    </div>

                    {summary.key_actions && summary.key_actions.length > 0 && (
                      <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="text-xl">✅</span>
                          Key Actions
                        </h2>
                        <ul className="space-y-2">
                          {summary.key_actions.map((action: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                              <span className="text-green-600 font-bold mt-0.5">→</span>
                              <span className="text-gray-700">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {summary.key_topics && summary.key_topics.length > 0 && (
                      <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="text-xl">🏷️</span>
                          Topics
                        </h2>
                        <div className="flex flex-wrap gap-2">
                          {summary.key_topics.map((topic: string, i: number) => (
                            <span
                              key={i}
                              className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full text-sm font-medium shadow-sm"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {tags.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag: any) => (
                        <span
                          key={tag.id}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm font-medium"
                        >
                          # {tag.tag_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Original Content */}
            <Card className="shadow-lg">
              <CardHeader>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">📖</span>
                  Full Content
                </h2>
              </CardHeader>
              <CardBody>
                <div className="prose prose-indigo max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {source.original_content}
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Sidebar CTA */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card className="shadow-lg border-2 border-indigo-200">
                <CardBody className="text-center p-6">
                  <div className="text-5xl mb-4">🚀</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Build Your Research Library
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm">
                    Save, organize, and synthesize research with AI-powered tools. Join thousands of researchers.
                  </p>
                  <Link href="/signup">
                    <Button className="w-full mb-3">
                      Start Free Today
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="ghost" className="w-full">
                      Already have an account?
                    </Button>
                  </Link>
                </CardBody>
              </Card>

              <Card className="mt-4 shadow-lg">
                <CardBody className="p-5">
                  <h4 className="font-semibold text-gray-900 mb-3">What You Get:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      AI summaries & concept extraction
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      PDF annotations & highlights
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      Knowledge graph visualization
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      Citation management
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      Research synthesis & publishing
                    </li>
                  </ul>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 text-sm">
            Powered by <span className="font-semibold text-white">Recall Notebook</span> - The AI Research Platform
          </p>
        </div>
      </footer>
    </div>
  )
}
