'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface AddSourcesModalProps {
  collectionId: string
  collectionName: string
  existingSourceIds: string[]
  onClose: () => void
  onSourcesAdded: (sources: any[]) => void
}

export default function AddSourcesModal({
  collectionId,
  collectionName,
  existingSourceIds,
  onClose,
  onSourcesAdded,
}: AddSourcesModalProps) {
  const [sources, setSources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchSources()
  }, [])

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/sources?limit=100')
      const data = await response.json()

      // Filter out sources already in collection
      const availableSources = data.data.filter(
        (s: any) => !existingSourceIds.includes(s.id)
      )

      setSources(availableSources)
    } catch (error) {
      console.error('Fetch error:', error)
      alert('Failed to load sources')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one source')
      return
    }

    setAdding(true)
    try {
      const addedSources: any[] = []

      for (const sourceId of selectedIds) {
        const response = await fetch(`/api/collections/${collectionId}/sources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source_id: sourceId }),
        })

        if (response.ok) {
          const source = sources.find((s) => s.id === sourceId)
          if (source) {
            addedSources.push(source)
          }
        }
      }

      if (addedSources.length > 0) {
        onSourcesAdded(addedSources)
        onClose()
      } else {
        alert('Failed to add sources')
      }
    } catch (error) {
      console.error('Add error:', error)
      alert('Failed to add sources')
    } finally {
      setAdding(false)
    }
  }

  const toggleSource = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    )
  }

  const filteredSources = sources.filter((source) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      source.title.toLowerCase().includes(query) ||
      source.summary?.[0]?.summary_text?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Add Sources to {collectionName}
          </h2>
          <p className="text-gray-600">
            Select sources to add to this collection
          </p>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sources..."
            disabled={loading}
          />
        </div>

        {/* Sources List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading sources...</div>
          ) : filteredSources.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No sources match your search' : 'No sources available to add'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSources.map((source) => (
                <div
                  key={source.id}
                  onClick={() => toggleSource(source.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedIds.includes(source.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(source.id)}
                      onChange={() => toggleSource(source.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {source.title}
                      </h3>
                      {source.summary?.[0]?.summary_text && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {source.summary[0].summary_text}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        {source.tags?.slice(0, 3).map((tag: any) => (
                          <span
                            key={tag.id}
                            className="text-xs px-2 py-1 bg-gray-100 rounded-full"
                          >
                            {tag.tag_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedIds.length} source{selectedIds.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="secondary" disabled={adding}>
              Cancel
            </Button>
            <Button onClick={handleAdd} loading={adding}>
              Add to Collection
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
