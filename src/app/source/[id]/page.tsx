import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import SourceDetailClient from '@/components/SourceDetailClient'

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
        <SourceDetailClient source={source as any} onDelete={handleDelete} />
      </div>
    </div>
  )
}
