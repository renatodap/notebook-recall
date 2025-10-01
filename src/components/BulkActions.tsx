'use client'

import { useState } from 'react'
import Button from './ui/Button'
import ExportButton from './ExportButton'
import SynthesisGenerator from './ai/SynthesisGenerator'
import BlogGenerator from './publishing/BlogGenerator'
import NewsletterGenerator from './publishing/NewsletterGenerator'
import type { CitationFormat } from '@/types'

interface BulkActionsProps {
  selectedSourceIds: string[]
  onClearSelection: () => void
  onActionComplete: () => void
}

export default function BulkActions({
  selectedSourceIds,
  onClearSelection,
  onActionComplete,
}: BulkActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showTagInput, setShowTagInput] = useState(false)
  const [showCitationExport, setShowCitationExport] = useState(false)
  const [showSynthesisGenerator, setShowSynthesisGenerator] = useState(false)
  const [showBlogGenerator, setShowBlogGenerator] = useState(false)
  const [showNewsletterGenerator, setShowNewsletterGenerator] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [isAddingTags, setIsAddingTags] = useState(false)
  const [exportingCitations, setExportingCitations] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Delete ${selectedSourceIds.length} source(s)? This cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch('/api/bulk/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_ids: selectedSourceIds }),
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      alert('Sources deleted successfully')
      onClearSelection()
      onActionComplete()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete sources. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddTags = async () => {
    if (!tagInput.trim()) {
      alert('Please enter at least one tag')
      return
    }

    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    if (tags.length === 0) {
      alert('Please enter valid tags')
      return
    }

    setIsAddingTags(true)
    try {
      const response = await fetch('/api/bulk/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_ids: selectedSourceIds,
          tags,
        }),
      })

      if (!response.ok) {
        throw new Error('Tag addition failed')
      }

      alert('Tags added successfully')
      setTagInput('')
      setShowTagInput(false)
      onClearSelection()
      onActionComplete()
    } catch (error) {
      console.error('Add tags error:', error)
      alert('Failed to add tags. Please try again.')
    } finally {
      setIsAddingTags(false)
    }
  }

  if (selectedSourceIds.length === 0) {
    return null
  }

  return (
    <div className="sticky top-0 z-10 bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-blue-900">
            {selectedSourceIds.length} source{selectedSourceIds.length > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={onClearSelection}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Clear selection
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Add Tags Button */}
          <Button
            onClick={() => setShowTagInput(!showTagInput)}
            variant="secondary"
            disabled={isDeleting || isAddingTags}
          >
            🏷️ Add Tags
          </Button>

          {/* Export Button */}
          <ExportButton sourceIds={selectedSourceIds} />

          {/* Export Citations Button */}
          <Button
            onClick={() => setShowCitationExport(!showCitationExport)}
            variant="secondary"
            disabled={exportingCitations}
          >
            📚 Export Citations
          </Button>

          {/* Generate Synthesis Button */}
          <Button
            onClick={() => setShowSynthesisGenerator(true)}
            variant="secondary"
            disabled={selectedSourceIds.length < 2}
          >
            📝 Synthesis
          </Button>

          {/* Analyze Gaps Button */}
          <Button
            onClick={async () => {
              if (selectedSourceIds.length < 2) {
                alert('Select at least 2 sources to analyze research gaps')
                return
              }
              const response = await fetch('/api/analysis/gaps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source_ids: selectedSourceIds }),
              })
              const data = await response.json()
              if (response.ok) {
                alert(`Gap Analysis Complete!\n\n${data.analysis.total_gaps} gaps identified:\n${Object.entries(data.analysis.gaps_by_category).map(([cat, count]) => `- ${cat}: ${count}`).join('\n')}`)
              }
            }}
            variant="secondary"
            disabled={selectedSourceIds.length < 2}
          >
            🔍 Find Gaps
          </Button>

          {/* Generate Blog Button */}
          <Button
            onClick={() => setShowBlogGenerator(true)}
            variant="secondary"
            disabled={selectedSourceIds.length === 0}
          >
            ✨ Blog Post
          </Button>

          {/* Generate Newsletter Button */}
          <Button
            onClick={() => setShowNewsletterGenerator(true)}
            variant="secondary"
            disabled={selectedSourceIds.length === 0}
          >
            📧 Newsletter
          </Button>

          {/* Delete Button */}
          <Button
            onClick={handleDelete}
            variant="secondary"
            disabled={isDeleting || isAddingTags}
            className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
          >
            {isDeleting ? 'Deleting...' : '🗑️ Delete'}
          </Button>
        </div>
      </div>

      {/* Tag Input */}
      {showTagInput && (
        <div className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Enter tags (comma-separated)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddTags()
              }
            }}
          />
          <Button
            onClick={handleAddTags}
            disabled={isAddingTags}
          >
            {isAddingTags ? 'Adding...' : 'Add'}
          </Button>
          <Button
            onClick={() => {
              setShowTagInput(false)
              setTagInput('')
            }}
            variant="secondary"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Citation Export Menu */}
      {showCitationExport && (
        <div className="mt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Export Format:</div>
          <div className="flex gap-2 flex-wrap">
            {(['bibtex', 'ris', 'apa', 'mla', 'chicago'] as CitationFormat[]).map((format) => (
              <Button
                key={format}
                onClick={async () => {
                  setExportingCitations(true)
                  try {
                    const response = await fetch('/api/citations/export-citations', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ source_ids: selectedSourceIds, format }),
                    })
                    if (response.ok) {
                      const blob = await response.blob()
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `bibliography.${format === 'bibtex' ? 'bib' : format === 'ris' ? 'ris' : 'txt'}`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      window.URL.revokeObjectURL(url)
                      setShowCitationExport(false)
                    } else {
                      alert('Some sources may not have citations yet. Visit each source and use "Cite" button to generate citations first.')
                    }
                  } catch (error) {
                    console.error('Export error:', error)
                    alert('Failed to export citations')
                  } finally {
                    setExportingCitations(false)
                  }
                }}
                variant="secondary"
                size="sm"
                disabled={exportingCitations}
              >
                {format.toUpperCase()}
              </Button>
            ))}
            <Button
              onClick={() => setShowCitationExport(false)}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Synthesis Generator Modal */}
      {showSynthesisGenerator && (
        <SynthesisGenerator
          sourceIds={selectedSourceIds}
          onClose={() => setShowSynthesisGenerator(false)}
        />
      )}

      {/* Blog Generator Modal */}
      {showBlogGenerator && (
        <BlogGenerator
          sourceIds={selectedSourceIds}
          onClose={() => setShowBlogGenerator(false)}
        />
      )}

      {/* Newsletter Generator Modal */}
      {showNewsletterGenerator && (
        <NewsletterGenerator
          sourceIds={selectedSourceIds}
          onClose={() => setShowNewsletterGenerator(false)}
        />
      )}
    </div>
  )
}
