import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WorkspacesClient from '@/components/workspaces/WorkspacesClient'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export const dynamic = 'force-dynamic'

export default async function WorkspacesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="bg-white border-b border-gray-200 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard">
            <Button variant="ghost">← Back to Dashboard</Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Team Workspaces
          </h1>
          <p className="text-lg text-gray-600">
            Collaborate on research projects with your team
          </p>
        </div>

        <WorkspacesClient userId={user.id} />
      </div>
    </div>
  )
}
