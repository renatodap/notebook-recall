import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import MobileNav from '@/components/MobileNav'

export const dynamic = 'force-dynamic'

export default async function SynthesisListPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch all synthesis reports
  const { data: reports } = await (supabase as any)
    .from('synthesis_reports')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64">
      <MobileNav />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Synthesis & Literature Reviews</h1>
          <p className="text-gray-600 mt-2">
            AI-generated research reports, literature reviews, and thematic analyses
          </p>
        </div>

        {/* Reports Grid */}
        {!reports || reports.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No synthesis reports yet
            </h3>
            <p className="text-gray-600 mb-6">
              Select multiple sources and generate a synthesis report to see them here
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report: any) => (
              <Link
                key={report.id}
                href={`/synthesis/${report.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                    {report.report_type.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-500">
                    {report.source_count} sources
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {report.title}
                </h3>

                {report.focus && (
                  <p className="text-sm text-gray-600 mb-3 italic">
                    Focus: {report.focus}
                  </p>
                )}

                <p className="text-sm text-gray-700 line-clamp-3 mb-4">
                  {report.executive_summary}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-blue-600 hover:underline">
                    View Report →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
