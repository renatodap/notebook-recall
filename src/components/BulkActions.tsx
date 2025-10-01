'use client'

import { useState } from 'react'
import Button from './ui/Button'
import ExportButton from './ExportButton'

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
  const [tagInput, setTagInput] = useState('')
  const [isAddingTags, setIsAddingTags] = useState(false)

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
    </div>
  )
}
