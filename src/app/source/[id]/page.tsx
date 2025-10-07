import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import SourceDetailClient from '@/components/SourceDetailClient'
import { generateMetadata as generateMeta } from '@/lib/metadata'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: source } = await supabase
    .from('sources')
    .select('title, content_type')
    .eq('id' as never, id)
    .single()

  const typedSource = source as unknown as { title?: string; content_type?: string } | null

  if (!typedSource) {
    return generateMeta({
      title: 'Source Not Found',
      description: 'The requested source could not be found.',
      path: '/source',
      noIndex: true,
    })
  }

  return generateMeta({
    title: typedSource.title || 'Source Detail',
    description: `View and manage your ${typedSource.content_type || 'source'}. Read AI summaries, take notes, and explore connections.`,
    keywords: ['source detail', typedSource.content_type || '', 'knowledge base', 'AI summary'],
    path: `/source/${id}`,
    noIndex: true,
  })
}

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
    .eq('id' as never, id)
    .eq('user_id' as never, user.id)
    .single()

  if (!source) {
    redirect('/dashboard')
  }

  const handleDelete = async () => {
    'use server'
    const supabase = await createServerClient()
    await supabase.from('sources').delete().eq('id' as never, id)
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
        <SourceDetailClient source={source as any} onDelete={handleDelete} />
      </div>
    </div>
  )
}
