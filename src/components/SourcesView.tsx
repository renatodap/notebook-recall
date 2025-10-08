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
      <div className="sticky top-0 z-10 pb-4 pt-2 md:pt-0" style={{ backgroundColor: 'var(--chat-bg-main)' }}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 md:py-4 border rounded-xl md:rounded-2xl text-base md:text-lg focus:outline-none focus:ring-2 focus:border-transparent shadow-sm"
            style={{
              backgroundColor: 'var(--chat-bg-input)',
              borderColor: 'var(--chat-border)',
              color: 'var(--chat-text-primary)'
            }}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl" style={{ color: 'var(--chat-text-secondary)' }}>
            🔍
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'var(--chat-text-secondary)' }}
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
            className="flex-shrink-0 px-4 py-2 border rounded-full text-sm font-medium transition-colors"
            style={selectionMode ? {
              backgroundColor: 'var(--chat-accent)',
              borderColor: 'var(--chat-accent)',
              color: 'var(--chat-text-primary)'
            } : {
              backgroundColor: 'var(--chat-bg-input)',
              borderColor: 'var(--chat-border)',
              color: 'var(--chat-text-primary)'
            }}
          >
            {selectionMode ? '✓ Selection Mode' : '☑️ Select'}
          </button>

          {selectionMode && filteredSources.length > 0 && (
            <button
              onClick={selectAll}
              className="flex-shrink-0 px-4 py-2 border rounded-full text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--chat-bg-input)',
                borderColor: 'var(--chat-border)',
                color: 'var(--chat-text-primary)'
              }}
            >
              Select All ({filteredSources.length})
            </button>
          )}

          <button
            onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
            className="flex-shrink-0 px-4 py-2 border rounded-full text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--chat-bg-input)',
              borderColor: 'var(--chat-border)',
              color: 'var(--chat-text-primary)'
            }}
          >
            {sortBy === 'newest' ? '⬇️ Newest' : '⬆️ Oldest'}
          </button>

          {Object.entries(contentTypeCounts).map(([type, count]) => (
            <button
              key={type}
              className="flex-shrink-0 px-4 py-2 border rounded-full text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--chat-bg-input)',
                borderColor: 'var(--chat-border)',
                color: 'var(--chat-text-secondary)'
              }}
            >
              {contentTypeIcons[type as keyof typeof contentTypeIcons]} {type} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm" style={{ color: 'var(--chat-text-secondary)' }}>
          {filteredSources.length} {filteredSources.length === 1 ? 'source' : 'sources'}
          {searchQuery && ` for "${searchQuery}"`}
        </p>
        {sources.length > 0 && (
          <button
            onClick={() => window.location.href = '/export'}
            className="text-sm font-medium transition-colors"
            style={{ color: 'var(--chat-accent)' }}
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
                />
              </div>
            </div>
          ))}
        </div>
      ) : sources.length === 0 ? (
        <div className="rounded-lg border p-12 text-center" style={{
          backgroundColor: 'var(--chat-bg-message-ai)',
          borderColor: 'var(--chat-border)'
        }}>
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full text-6xl" style={{ backgroundColor: 'var(--chat-border)' }}>📚</div>
          </div>
          <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--chat-text-primary)' }}>Your knowledge base is empty</h3>
          <p className="max-w-md mx-auto mb-8" style={{ color: 'var(--chat-text-secondary)' }}>
            Add your first source to get started. Try pasting a URL, uploading a PDF, or writing a note.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/add"
              className="px-6 py-3 rounded-lg transition-colors font-semibold"
              style={{
                backgroundColor: 'var(--chat-accent)',
                color: 'var(--chat-text-primary)'
              }}
            >
              Add Your First Source
            </a>
            <a
              href="/onboarding"
              className="px-6 py-3 border rounded-lg transition-colors font-medium"
              style={{
                backgroundColor: 'var(--chat-bg-input)',
                borderColor: 'var(--chat-border)',
                color: 'var(--chat-text-primary)'
              }}
            >
              See How It Works
            </a>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border p-12 text-center" style={{
          backgroundColor: 'var(--chat-bg-message-ai)',
          borderColor: 'var(--chat-border)'
        }}>
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full text-6xl" style={{ backgroundColor: 'var(--chat-border)' }}>🔍</div>
          </div>
          <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--chat-text-primary)' }}>No results found</h3>
          <p className="max-w-md mx-auto mb-8" style={{ color: 'var(--chat-text-secondary)' }}>
            Try a different search term, or add more sources to your knowledge base.
          </p>
          <div className="flex gap-4 justify-center mb-6">
            <button
              onClick={() => setSearchQuery('')}
              className="px-6 py-3 rounded-lg transition-colors font-semibold"
              style={{
                backgroundColor: 'var(--chat-accent)',
                color: 'var(--chat-text-primary)'
              }}
            >
              Clear Search
            </button>
            <a
              href="/add"
              className="px-6 py-3 border rounded-lg transition-colors font-medium"
              style={{
                backgroundColor: 'var(--chat-bg-input)',
                borderColor: 'var(--chat-border)',
                color: 'var(--chat-text-primary)'
              }}
            >
              Add More Sources
            </a>
          </div>
          <div className="rounded-lg p-4 max-w-md mx-auto" style={{
            backgroundColor: 'var(--chat-bg-input)',
            borderColor: 'var(--chat-border)'
          }}>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--chat-text-primary)' }}>💡 Suggestions:</p>
            <ul className="text-sm space-y-2 text-left" style={{ color: 'var(--chat-text-secondary)' }}>
              <li className="flex items-start gap-2">
                <span className="mt-0.5" style={{ color: 'var(--chat-border)' }}>•</span>
                <span>Use simpler keywords</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5" style={{ color: 'var(--chat-border)' }}>•</span>
                <span>Try synonyms or related terms</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5" style={{ color: 'var(--chat-border)' }}>•</span>
                <span>Check for typos</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
