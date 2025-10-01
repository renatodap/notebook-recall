'use client'

import { useState, useCallback, useEffect } from 'react'
import SourceCard from './SourceCard'
import BulkActions from './BulkActions'
import TagFilter from './tags/TagFilter'
import ExportButton from './ExportButton'
import type { Source, Summary, Tag } from '@/types'

interface DashboardClientProps {
  initialSources: (Source & { summary: Summary[]; tags: Tag[] })[]
}

export default function DashboardClient({ initialSources }: DashboardClientProps) {
  const [sources, setSources] = useState(initialSources)
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])
  const [filteredSources, setFilteredSources] = useState(initialSources)
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [filterLogic, setFilterLogic] = useState<'OR' | 'AND'>('OR')

  // Sync sources when initialSources changes (after router.refresh())
  useEffect(() => {
    setSources(initialSources)
    setFilteredSources(initialSources)
  }, [initialSources])

  // Refresh sources from API
  const refreshSources = useCallback(async () => {
    try {
      const response = await fetch('/api/sources')
      if (response.ok) {
        const data = await response.json()
        setSources(data.sources || [])
      }
    } catch (error) {
      console.error('Failed to refresh sources:', error)
    }
  }, [])

  // Apply tag filtering
  useEffect(() => {
    if (filterTags.length === 0) {
      setFilteredSources(sources)
      return
    }

    const filtered = sources.filter((source) => {
      const sourceTagNames = source.tags.map((t) => t.tag_name.toLowerCase())

      if (filterLogic === 'AND') {
        return filterTags.every((filterTag) =>
          sourceTagNames.includes(filterTag.toLowerCase())
        )
      } else {
        return filterTags.some((filterTag) =>
          sourceTagNames.includes(filterTag.toLowerCase())
        )
      }
    })

    setFilteredSources(filtered)
  }, [sources, filterTags, filterLogic])

  const handleSourceSelect = (sourceId: string, selected: boolean) => {
    setSelectedSourceIds((prev) =>
      selected ? [...prev, sourceId] : prev.filter((id) => id !== sourceId)
    )
  }

  const handleClearSelection = () => {
    setSelectedSourceIds([])
  }

  const handleActionComplete = () => {
    setSelectedSourceIds([])
    refreshSources()
  }

  const handleFilterChange = useCallback((tags: string[], logic: 'OR' | 'AND') => {
    setFilterTags(tags)
    setFilterLogic(logic)
  }, [])

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Left Sidebar - Tag Filter */}
      <div className="lg:col-span-1 space-y-4">
        <TagFilter onFilterChange={handleFilterChange} />
      </div>

      {/* Main Content */}
      <div className="lg:col-span-2">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Sources</h2>
            <p className="text-gray-600">
              {filteredSources.length} {filteredSources.length === 1 ? 'item' : 'items'}
              {filterTags.length > 0 && ` (filtered from ${sources.length} total)`}
            </p>
          </div>
          <ExportButton className="ml-4" />
        </div>

        {/* Bulk Actions Toolbar */}
        <BulkActions
          selectedSourceIds={selectedSourceIds}
          onClearSelection={handleClearSelection}
          onActionComplete={handleActionComplete}
        />

        {/* Sources Grid */}
        {filteredSources.length > 0 ? (
          <div className="grid gap-4">
            {filteredSources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                selectable
                selected={selectedSourceIds.includes(source.id)}
                onSelect={handleSourceSelect}
              />
            ))}
          </div>
        ) : sources.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sources yet</h3>
            <p className="text-gray-600">Add your first piece of content to get started</p>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-300">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matching sources</h3>
            <p className="text-gray-600">
              Try adjusting your tag filters
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
