import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import KnowledgeGraphClient from '@/components/visualization/KnowledgeGraphClient'

export default async function GraphPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Graph</h1>
          <p className="text-gray-600 mt-2">
            Visualize connections between your sources, concepts, and collections
          </p>
        </div>

        {/* Graph Container */}
        <div className="bg-white rounded-lg shadow-lg" style={{ height: 'calc(100vh - 250px)' }}>
          <KnowledgeGraphClient />
        </div>
      </div>
    </div>
  )
}
