import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import ReferenceImporter from '@/components/import/ReferenceImporter'

export const dynamic = 'force-dynamic'

export default async function ImportPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard">
            <Button variant="ghost">← Back to Dashboard</Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Import Your Research Library
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Seamlessly migrate from Zotero, Mendeley, or EndNote. Import your entire reference library in seconds.
          </p>
        </div>

        <ReferenceImporter
          onImportComplete={() => {
            window.location.href = '/dashboard'
          }}
        />

        {/* How It Works */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            How to Import from Popular Reference Managers
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Zotero */}
            <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
              <div className="text-3xl mb-3">📘</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">From Zotero</h3>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Open Zotero desktop app</li>
                <li>Select all items (or a collection)</li>
                <li>Right-click → Export Items</li>
                <li>Choose &quot;BibTeX&quot; format</li>
                <li>Upload the .bib file here</li>
              </ol>
            </div>

            {/* Mendeley */}
            <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
              <div className="text-3xl mb-3">📗</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">From Mendeley</h3>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Open Mendeley desktop app</li>
                <li>Select references to export</li>
                <li>File → Export...</li>
                <li>Choose &quot;BibTeX (*.bib)&quot; format</li>
                <li>Upload the .bib file here</li>
              </ol>
            </div>

            {/* EndNote */}
            <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
              <div className="text-3xl mb-3">📕</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">From EndNote</h3>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Open EndNote library</li>
                <li>Select references to export</li>
                <li>File → Export...</li>
                <li>Choose &quot;RIS&quot; or &quot;XML&quot; format</li>
                <li>Upload the file here</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-12 p-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
            What Happens After Import?
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <p className="font-semibold text-gray-900">AI Processing</p>
                <p className="text-sm text-gray-600">
                  We&apos;ll analyze each reference and extract key metadata
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📚</span>
              <div>
                <p className="font-semibold text-gray-900">Organize</p>
                <p className="text-sm text-gray-600">
                  References become searchable sources in your library
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔗</span>
              <div>
                <p className="font-semibold text-gray-900">Auto-Link</p>
                <p className="text-sm text-gray-600">
                  We&apos;ll discover connections between your references
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">✨</span>
              <div>
                <p className="font-semibold text-gray-900">Ready to Use</p>
                <p className="text-sm text-gray-600">
                  Annotate, synthesize, and publish immediately
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
