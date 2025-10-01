'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '../ui/Button'
import SourceCard from '../SourceCard'
import AddSourcesModal from './AddSourcesModal'
import type { Collection, Source, Summary, Tag } from '@/types'

interface CollectionDetailClientProps {
  collection: Collection
  initialSources: (Source & { summary: Summary[]; tags: Tag[]; collection_note?: string })[]
}

export default function CollectionDetailClient({
  collection,
  initialSources,
}: CollectionDetailClientProps) {
  const router = useRouter()
  const [sources, setSources] = useState(initialSources)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleRemoveSource = async (sourceId: string) => {
    if (!confirm('Remove this source from the collection?')) return

    try {
      const response = await fetch(
        `/api/collections/${collection.id}/sources?source_id=${sourceId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        setSources(sources.filter((s) => s.id !== sourceId))
      } else {
        alert('Failed to remove source')
      }
    } catch (error) {
      console.error('Remove error:', error)
      alert('Failed to remove source')
    }
  }

  const handleDeleteCollection = async () => {
    if (!confirm(`Delete collection "${collection.name}"? This will not delete the sources.`)) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/collections')
      } else {
        alert('Failed to delete collection')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete collection')
    } finally {
      setDeleting(false)
    }
  }

  const handleSourcesAdded = (newSources: any[]) => {
    setSources([...newSources, ...sources])
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => router.push('/collections')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Collections
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="text-gray-600 text-lg">{collection.description}</p>
            )}
          </div>
          <Button
            onClick={handleDeleteCollection}
            variant="secondary"
            loading={deleting}
            className="ml-4"
          >
            Delete Collection
          </Button>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            📚 {sources.length} source{sources.length !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            {collection.is_public ? '🌐 Public' : '🔒 Private'}
          </span>
          <span className="text-gray-400">
            Created {new Date(collection.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 flex gap-3">
        <Button onClick={() => setShowAddModal(true)}>
          + Add Sources
        </Button>
        <Button
          variant="secondary"
          onClick={() => router.push(`/search?collection_id=${collection.id}`)}
        >
          🔍 Search in Collection
        </Button>
      </div>

      {/* Sources */}
      {sources.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No sources yet
          </h3>
          <p className="text-gray-600 mb-6">
            Add sources to this collection to get started
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            Add Your First Source
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sources.map((source) => (
            <div key={source.id} className="relative">
              <SourceCard
                source={source}
                summary={source.summary[0]}
                tags={source.tags}
                onClick={() => router.push(`/search?q=${encodeURIComponent(source.title)}`)}
              />
              {source.collection_note && (
                <div className="mt-2 ml-4 text-sm text-gray-600 italic">
                  Note: {source.collection_note}
                </div>
              )}
              <button
                onClick={() => handleRemoveSource(source.id)}
                className="absolute top-4 right-4 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Sources Modal */}
      {showAddModal && (
        <AddSourcesModal
          collectionId={collection.id}
          collectionName={collection.name}
          existingSourceIds={sources.map((s) => s.id)}
          onClose={() => setShowAddModal(false)}
          onSourcesAdded={handleSourcesAdded}
        />
      )}
    </div>
  )
}
