import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import MobileNav from '@/components/MobileNav'

export const dynamic = 'force-dynamic'

export default async function PublishingPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: outputs } = await (supabase as any)
    .from('published_outputs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64">
      <MobileNav />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Publishing Dashboard</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Total Outputs</h3>
          <p className="text-3xl">{outputs?.length || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Drafts</h3>
          <p className="text-3xl">{outputs?.filter((o: any) => o.status === 'draft').length || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Published</h3>
          <p className="text-3xl">{outputs?.filter((o: any) => o.status === 'published').length || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Your Outputs</h2>
        {outputs && outputs.length > 0 ? (
          <div className="space-y-4">
            {outputs.map((output: any) => (
              <div key={output.id} className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{output.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Type: {output.output_type} | Status: {output.status}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {new Date(output.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/api/publishing/${output.id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No published outputs yet.</p>
            <p className="text-sm mt-2">
              Go to your sources and use the publishing features in the actions menu.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-3">Publishing Features</h2>
        <p className="text-sm text-gray-700 mb-4">
          Generate professional content from your research sources. All publishing features are available from your dashboard when you select sources.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>✅ Blog Post Generator</div>
          <div>✅ Newsletter Generator</div>
          <div>✅ Academic Paper Writer</div>
          <div>✅ Presentation Generator</div>
          <div>✅ Book Outline Generator</div>
          <div>✅ Literature Review Templates</div>
        </div>
      </div>
      </div>
    </div>
  )
}
