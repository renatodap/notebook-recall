'use client'

import { useState, useEffect } from 'react'
import TagPill from './TagPill'
import type { TagWithCount } from '@/types'

interface TagFilterProps {
  onFilterChange: (tags: string[], logic: 'OR' | 'AND') => void
}

export default function TagFilter({ onFilterChange }: TagFilterProps) {
  const [availableTags, setAvailableTags] = useState<TagWithCount[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagLogic, setTagLogic] = useState<'OR' | 'AND'>('OR')
  const [isLoading, setIsLoading] = useState(true)

  // Fetch available tags
  useEffect(() => {
    async function fetchTags() {
      try {
        const response = await fetch('/api/tags')
        if (response.ok) {
          const data = await response.json()
          setAvailableTags(data.tags || [])
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTags()
  }, [])

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange(selectedTags, tagLogic)
  }, [selectedTags, tagLogic, onFilterChange])

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    )
  }

  const clearAll = () => {
    setSelectedTags([])
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-gray-500 text-sm">Loading tags...</div>
      </div>
    )
  }

  if (availableTags.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-gray-500 text-sm">
          No tags yet. Tags will appear here once you add sources.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Filter by Tags</h3>
        {selectedTags.length > 0 && (
          <button
            onClick={clearAll}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Selected:</div>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <TagPill
                key={tag}
                tagName={tag}
                selected
                onRemove={() => toggleTag(tag)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Logic Toggle */}
      {selectedTags.length > 1 && (
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-700 font-medium">Match:</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="logic"
              checked={tagLogic === 'OR'}
              onChange={() => setTagLogic('OR')}
              className="text-blue-600"
            />
            <span>ANY tag (OR)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="logic"
              checked={tagLogic === 'AND'}
              onChange={() => setTagLogic('AND')}
              className="text-blue-600"
            />
            <span>ALL tags (AND)</span>
          </label>
        </div>
      )}

      {/* Available Tags */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">
          Available Tags:
        </div>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          {availableTags.map((tag) => (
            <TagPill
              key={tag.tag_name}
              tagName={tag.tag_name}
              count={tag.count}
              selected={selectedTags.includes(tag.tag_name)}
              onClick={() => toggleTag(tag.tag_name)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
