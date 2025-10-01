'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SynthesisReportClientProps {
  report: any
}

export default function SynthesisReportClient({ report }: SynthesisReportClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'themes' | 'findings' | 'full'>('overview')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this synthesis report? This cannot be undone.')) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/synthesis/${report.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/synthesis')
      } else {
        alert('Failed to delete report')
      }
    } catch (err) {
      alert('Error deleting report')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExport = () => {
    const markdown = `# ${report.title}

${report.focus ? `**Focus:** ${report.focus}\n\n` : ''}**Generated:** ${new Date(report.created_at).toLocaleDateString()}
**Sources:** ${report.source_count}
**Type:** ${report.report_type.replace('_', ' ')}

---

## Executive Summary

${report.executive_summary}

---

${report.full_report}

---

## Sources

${report.sources.map((s: any, i: number) => `${i + 1}. ${s.title}`).join('\n')}
`

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.title.replace(/[^a-z0-9]/gi, '_')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">
            Dashboard
          </Link>
          {' / '}
          <Link href="/synthesis" className="text-blue-600 hover:underline text-sm">
            Synthesis Reports
          </Link>
          {' / '}
          <span className="text-gray-600 text-sm">{report.title}</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{report.title}</h1>
              {report.focus && (
                <p className="text-gray-600 italic mb-2">Focus: {report.focus}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                  {report.report_type.replace('_', ' ')}
                </span>
                <span>{report.source_count} sources</span>
                <span>{new Date(report.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md border"
              >
                📥 Export
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md border border-red-200 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <h3 className="font-semibold text-gray-900 mb-2">Executive Summary</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{report.executive_summary}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('themes')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'themes'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Themes
              </button>
              <button
                onClick={() => setActiveTab('findings')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'findings'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Findings
              </button>
              <button
                onClick={() => setActiveTab('full')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'full'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Full Report
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key Findings */}
                {report.key_findings && report.key_findings.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Findings</h3>
                    <ul className="space-y-2">
                      {report.key_findings.map((finding: string, i: number) => (
                        <li key={i} className="flex gap-3">
                          <span className="text-blue-600 font-bold">•</span>
                          <span className="text-gray-700">{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Agreements */}
                {report.agreements && report.agreements.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Areas of Agreement</h3>
                    <ul className="space-y-2">
                      {report.agreements.map((agreement: string, i: number) => (
                        <li key={i} className="flex gap-3">
                          <span className="text-green-600">✓</span>
                          <span className="text-gray-700">{agreement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Disagreements */}
                {report.disagreements && report.disagreements.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Areas of Disagreement</h3>
                    <ul className="space-y-2">
                      {report.disagreements.map((disagreement: string, i: number) => (
                        <li key={i} className="flex gap-3">
                          <span className="text-red-600">⚠</span>
                          <span className="text-gray-700">{disagreement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Research Gaps */}
                {report.gaps && report.gaps.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Research Gaps</h3>
                    <ul className="space-y-2">
                      {report.gaps.map((gap: string, i: number) => (
                        <li key={i} className="flex gap-3">
                          <span className="text-yellow-600">?</span>
                          <span className="text-gray-700">{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Themes Tab */}
            {activeTab === 'themes' && (
              <div className="space-y-4">
                {report.themes && report.themes.length > 0 ? (
                  report.themes.map((theme: any, i: number) => (
                    <div key={i} className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{theme.name}</h3>
                      <p className="text-gray-700 mb-3">{theme.description}</p>
                      {theme.sources && theme.sources.length > 0 && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Related sources:</span> {theme.sources.join(', ')}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No themes identified</p>
                )}
              </div>
            )}

            {/* Findings Tab */}
            {activeTab === 'findings' && (
              <div className="space-y-6">
                {report.key_findings && report.key_findings.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">All Key Findings</h3>
                    <ul className="space-y-2">
                      {report.key_findings.map((finding: string, i: number) => (
                        <li key={i} className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Full Report Tab */}
            {activeTab === 'full' && (
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {report.full_report}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sources */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Sources ({report.sources.length})</h2>
          <div className="grid gap-3">
            {report.sources.map((source: any, i: number) => (
              <Link
                key={source.id}
                href={`/source/${source.id}`}
                className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50"
              >
                <span className="font-medium text-gray-500">[{i + 1}]</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{source.title}</p>
                  <p className="text-xs text-gray-500">
                    {source.content_type} • {new Date(source.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-blue-600">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
