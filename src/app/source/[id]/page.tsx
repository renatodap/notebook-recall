import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: source } = await supabase
    .from('sources')
    .select(`
      *,
      summary:summaries(*),
      tags:tags(*)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!source) {
    redirect('/dashboard')
  }

  const summary = (source as any).summary?.[0]
  const sourceData = source as any

  const handleDelete = async () => {
    'use server'
    const supabase = await createServerClient()
    await supabase.from('sources').delete().eq('id', id)
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 mb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard">
            <Button variant="ghost">← Back to Dashboard</Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{sourceData.title}</h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="capitalize">{sourceData.content_type}</span>
                    <span>•</span>
                    <span>{new Date(sourceData.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <form action={handleDelete}>
                  <Button type="submit" variant="danger" size="sm">
                    Delete
                  </Button>
                </form>
              </div>
            </CardHeader>
            <CardBody>
              {sourceData.url && (
                <div className="mb-4">
                  <a
                    href={sourceData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 text-sm"
                  >
                    🔗 {sourceData.url}
                  </a>
                </div>
              )}

              {summary && (
                <>
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Summary</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{summary.summary_text}</p>
                  </div>

                  {summary.key_actions && summary.key_actions.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">Key Actions</h2>
                      <ul className="list-disc list-inside space-y-1">
                        {summary.key_actions.map((action: string, i: number) => (
                          <li key={i} className="text-gray-700">{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {summary.key_topics && summary.key_topics.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">Topics</h2>
                      <div className="flex flex-wrap gap-2">
                        {summary.key_topics.map((topic: string, i: number) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Original Content</h2>
            </CardHeader>
            <CardBody>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap text-sm">
                  {sourceData.original_content}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
