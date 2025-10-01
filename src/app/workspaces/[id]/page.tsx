import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WorkspaceDetailClient from '@/components/workspaces/WorkspaceDetailClient'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export const dynamic = 'force-dynamic'

export default async function WorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const workspaceRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/workspaces/${id}`, {
    cache: 'no-store',
    headers: {
      'Cookie': `sb-access-token=${(await supabase.auth.getSession()).data.session?.access_token}`
    }
  })

  if (!workspaceRes.ok) {
    redirect('/workspaces')
  }

  const { workspace, members } = await workspaceRes.json()

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="bg-white border-b border-gray-200 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/workspaces">
            <Button variant="ghost">← Back to Workspaces</Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <WorkspaceDetailClient
          workspace={workspace}
          members={members}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}
