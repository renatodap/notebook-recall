'use client'

import { useState, useEffect } from 'react'
import SourceCard from './SourceCard'
import BulkActions from './BulkActions'
import type { Source, Summary, Tag } from '@/types'

interface SourcesViewProps {
  initialSources: (Source & { summary: Summary[]; tags: Tag[] })[]
}

export default function SourcesView({ initialSources }: SourcesViewProps) {
  const [sources, setSources] = useState(initialSources)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredSources, setFilteredSources] = useState(initialSources)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectionMode, setSelectionMode] = useState(false)

  // Sync with initialSources when they change
  useEffect(() => {
    setSources(initialSources)
    setFilteredSources(initialSources)
  }, [initialSources])

  // Filter and sort sources
  useEffect(() => {
    let filtered = sources

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = sources.filter((source) => {
        const titleMatch = source.title.toLowerCase().includes(query)
        const summaryMatch = source.summary?.[0]?.summary_text.toLowerCase().includes(query)
        const topicsMatch = source.summary?.[0]?.key_topics.some(topic =>
          topic.toLowerCase().includes(query)
        )
        return titleMatch || summaryMatch || topicsMatch
      })
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB
    })

    setFilteredSources(filtered)
  }, [sources, searchQuery, sortBy])

  const contentTypeIcons = {
    text: '📝',
    url: '🔗',
    pdf: '📄',
    image: '🖼️',
    note: '📋',
  }

  const contentTypeCounts = sources.reduce((acc, source) => {
    acc[source.content_type] = (acc[source.content_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    setSelectedIds(filteredSources.map(s => s.id))
  }

  const clearSelection = () => {
    setSelectedIds([])
    setSelectionMode(false)
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <BulkActions
          selectedSourceIds={selectedIds}
          onClearSelection={clearSelection}
          onActionComplete={() => {
            clearSelection()
            window.location.reload()
          }}
        />
      )}

      {/* Search Bar */}
      <div className="sticky top-0 z-10 bg-gray-50 pb-4 pt-2 md:pt-0">
        <div className="relative">
          <input
            type="text"
            placeholder="Search sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 md:py-4 border border-gray-300 rounded-xl md:rounded-2xl bg-white text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
            🔍
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-2">
          <button
            onClick={() => {
              setSelectionMode(!selectionMode)
              if (selectionMode) {
                clearSelection()
              }
            }}
            className={`flex-shrink-0 px-4 py-2 border rounded-full text-sm font-medium transition-colors ${
              selectionMode
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {selectionMode ? '✓ Selection Mode' : '☑️ Select'}
          </button>

          {selectionMode && filteredSources.length > 0 && (
            <button
              onClick={selectAll}
              className="flex-shrink-0 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Select All ({filteredSources.length})
            </button>
          )}

          <button
            onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
            className="flex-shrink-0 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {sortBy === 'newest' ? '⬇️ Newest' : '⬆️ Oldest'}
          </button>

          {Object.entries(contentTypeCounts).map(([type, count]) => (
            <button
              key={type}
              className="flex-shrink-0 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
            >
              {contentTypeIcons[type as keyof typeof contentTypeIcons]} {type} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-600">
          {filteredSources.length} {filteredSources.length === 1 ? 'source' : 'sources'}
          {searchQuery && ` for "${searchQuery}"`}
        </p>
        {sources.length > 0 && (
          <button
            onClick={() => window.location.href = '/export'}
            className="text-sm text-indigo-600 font-medium hover:text-indigo-700"
          >
            Export All
          </button>
        )}
      </div>

      {/* Sources List */}
      {filteredSources.length > 0 ? (
        <div className="space-y-3">
          {filteredSources.map((source) => (
            <div key={source.id} className="flex items-start gap-3">
              {selectionMode && (
                <input
                  type="checkbox"
                  checked={selectedIds.includes(source.id)}
                  onChange={() => toggleSelection(source.id)}
                  className="mt-4 w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
              )}
              <div className="flex-1">
                <SourceCard
                  source={source}
                  summary={source.summary[0]}
                  tags={source.tags}
                  onClick={() => window.location.href = `/search?q=${encodeURIComponent(source.title)}`}
                />
              </div>
            </div>
          ))}
        </div>
      ) : sources.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No sources yet</h3>
          <p className="text-gray-600 mb-6">
            Start building your knowledge library
          </p>
          <a
            href="/add"
            className="inline-block bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Add Your First Source
          </a>
        </div>
      ) : (
        <div className="text-center py-16 px-4">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search or filters
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-indigo-600 font-medium hover:text-indigo-700"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  )
}
