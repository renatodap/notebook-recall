'use client'

import { useState } from 'react'
import { Card, CardBody, CardHeader } from './ui/Card'
import Button from './ui/Button'
import CitationManager from './academic/CitationManager'
import ConnectionsPanel from './ai/ConnectionsPanel'
import ContradictionsPanel from './ai/ContradictionsPanel'
import PDFViewer from './pdf/PDFViewer'
import ShareButton from './ShareButton'
import ExportDocumentButton from './ExportDocumentButton'
import type { Source, Summary, Tag } from '@/types'

interface SourceDetailClientProps {
  source: Source & { summary: Summary[]; tags: Tag[] }
  onDelete: () => void
}

export default function SourceDetailClient({ source, onDelete }: SourceDetailClientProps) {
  const [showCitationManager, setShowCitationManager] = useState(false)
  const [showPDFViewer, setShowPDFViewer] = useState(false)

  const summary = source.summary?.[0]
  const isPDF = source.content_type === 'pdf' || source.url?.endsWith('.pdf')

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* PDF Viewer Mode */}
        {isPDF && showPDFViewer && source.url ? (
          <div className="h-[800px]">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-gray-900">📄 PDF Annotations</h2>
              <Button
                onClick={() => setShowPDFViewer(false)}
                variant="ghost"
                size="sm"
              >
                ← Back to Summary
              </Button>
            </div>
            <PDFViewer sourceId={source.id} pdfUrl={source.url} />
          </div>
        ) : (
          <>
            {/* Source Details Card */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3">
                  <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{source.title}</h1>
                    <div className="flex items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-600 flex-wrap">
                      <span className="capitalize">{source.content_type}</span>
                      <span>•</span>
                      <span>{new Date(source.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isPDF && source.url && (
                      <Button
                        onClick={() => setShowPDFViewer(true)}
                        variant="primary"
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 flex-1 sm:flex-none"
                      >
                        📄 <span className="hidden xs:inline">Annotate PDF</span><span className="xs:hidden">PDF</span>
                      </Button>
                    )}
                    <ShareButton sourceId={source.id} />
                    <ExportDocumentButton sourceId={source.id} />
                    <Button
                      onClick={() => setShowCitationManager(true)}
                      variant="secondary"
                      size="sm"
                      className="flex-1 sm:flex-none"
                    >
                      📚 <span className="hidden xs:inline">Cite</span>
                    </Button>
                    <form action={onDelete} className="flex-1 sm:flex-none">
                      <Button type="submit" variant="secondary" size="sm" className="text-red-600 hover:bg-red-50 w-full">
                        🗑️ <span className="hidden xs:inline">Delete</span>
                      </Button>
                    </form>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {source.url && (
                  <div className="mb-4">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 text-sm break-all"
                    >
                      🔗 {source.url}
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
                          {summary.key_actions.map((action, i) => (
                            <li key={i} className="text-gray-700">{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {summary.key_topics && summary.key_topics.length > 0 && (
                      <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Topics</h2>
                        <div className="flex flex-wrap gap-2">
                          {summary.key_topics.map((topic, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch('/api/concepts/extract', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ source_id: source.id })
                              })
                              if (res.ok) {
                                alert('Concepts extracted! Refresh to see.')
                              }
                            } catch (e) {
                              console.error(e)
                            }
                          }}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                        >
                          🧠 Extract AI Concepts
                        </button>
                      </div>
                    )}
                  </>
                )}

                {source.tags && source.tags.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                      {source.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {tag.tag_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Original Content Card */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Original Content</h2>
              </CardHeader>
              <CardBody>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap text-sm">
                    {source.original_content}
                  </p>
                </div>
              </CardBody>
            </Card>
          </>
        )}
      </div>

      {/* Sidebar - Only show when not in PDF viewer mode */}
      {!showPDFViewer && (
        <div className="lg:col-span-1 space-y-6">
          <ConnectionsPanel sourceId={source.id} />
          <ContradictionsPanel sourceId={source.id} />
        </div>
      )}

      {/* Citation Manager Modal */}
      {showCitationManager && (
        <CitationManager
          sourceId={source.id}
          onClose={() => setShowCitationManager(false)}
        />
      )}
    </div>
  )
}
