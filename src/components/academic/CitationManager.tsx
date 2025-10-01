'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import type { Citation, CitationFormat } from '@/types'

interface CitationManagerProps {
  sourceId: string
  onClose: () => void
}

export default function CitationManager({ sourceId, onClose }: CitationManagerProps) {
  const [citation, setCitation] = useState<Citation | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [doi, setDoi] = useState('')
  const [url, setUrl] = useState('')
  const [activeTab, setActiveTab] = useState<'fetch' | 'formats' | 'edit'>('fetch')
  const [copiedFormat, setCopiedFormat] = useState<CitationFormat | null>(null)

  useEffect(() => {
    fetchCitation()
  }, [sourceId])

  const fetchCitation = async () => {
    try {
      const response = await fetch(`/api/citations/source/${sourceId}`)
      if (response.ok) {
        const data = await response.json()
        setCitation(data.citation)
        if (data.citation) {
          setActiveTab('formats')
        }
      }
    } catch (error) {
      console.error('Failed to fetch citation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFetchMetadata = async () => {
    if (!doi && !url) {
      alert('Enter DOI or URL')
      return
    }

    setFetching(true)
    try {
      const response = await fetch('/api/citations/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doi, url, source_id: sourceId }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch citation')
      }

      const data = await response.json()
      setCitation(data.citation)
      setActiveTab('formats')
      alert('Citation metadata fetched successfully!')
    } catch (error) {
      console.error('Fetch error:', error)
      alert('Failed to fetch citation metadata. Try manual entry.')
    } finally {
      setFetching(false)
    }
  }

  const copyToClipboard = async (text: string, format: CitationFormat) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedFormat(format)
      setTimeout(() => setCopiedFormat(null), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">Loading citation...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Citation Manager</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('fetch')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'fetch'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600'
            }`}
          >
            Fetch Metadata
          </button>
          <button
            onClick={() => setActiveTab('formats')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'formats'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600'
            }`}
            disabled={!citation}
          >
            Citation Formats
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'fetch' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Fetch from DOI or URL</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      DOI (e.g., 10.1234/example)
                    </label>
                    <Input
                      value={doi}
                      onChange={(e) => setDoi(e.target.value)}
                      placeholder="10.1234/example"
                      disabled={fetching}
                    />
                  </div>

                  <div className="text-center text-gray-500 font-medium">OR</div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL (paper URL, DOI URL, etc.)
                    </label>
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://doi.org/10.1234/example"
                      disabled={fetching}
                    />
                  </div>

                  <Button
                    onClick={handleFetchMetadata}
                    loading={fetching}
                    className="w-full"
                  >
                    Fetch Citation Metadata
                  </Button>

                  {citation && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                      <p className="text-green-800 font-medium">
                        ✓ Citation metadata found!
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        {citation.citation_metadata.authors.slice(0, 3).join(', ')}
                        {citation.citation_metadata.authors.length > 3 && ', et al.'}
                        {' '}({citation.citation_metadata.year})
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'formats' && citation && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Formatted Citations</h3>

              {/* BibTeX */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-gray-900">BibTeX</label>
                  <button
                    onClick={() => copyToClipboard(citation.bibtex || '', 'bibtex')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {copiedFormat === 'bibtex' ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <pre className="bg-gray-50 p-4 rounded border border-gray-200 text-sm overflow-x-auto">
                  {citation.bibtex}
                </pre>
              </div>

              {/* APA */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-gray-900">APA 7th Edition</label>
                  <button
                    onClick={() => copyToClipboard(citation.apa || '', 'apa')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {copiedFormat === 'apa' ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-200 text-sm">
                  {citation.apa}
                </div>
              </div>

              {/* MLA */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-gray-900">MLA 9th Edition</label>
                  <button
                    onClick={() => copyToClipboard(citation.mla || '', 'mla')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {copiedFormat === 'mla' ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-200 text-sm">
                  {citation.mla}
                </div>
              </div>

              {/* Chicago */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-gray-900">Chicago 17th Edition</label>
                  <button
                    onClick={() => copyToClipboard(citation.chicago || '', 'chicago')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {copiedFormat === 'chicago' ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-200 text-sm">
                  {citation.chicago}
                </div>
              </div>

              {/* RIS */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-gray-900">RIS Format</label>
                  <button
                    onClick={() => copyToClipboard(citation.ris || '', 'ris')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {copiedFormat === 'ris' ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <pre className="bg-gray-50 p-4 rounded border border-gray-200 text-sm overflow-x-auto">
                  {citation.ris}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
