'use client'

import { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { Card, CardBody, CardHeader } from '../ui/Card'
import Link from 'next/link'
import type { Collection } from '@/types'

interface CollectionsClientProps {
  initialCollections: (Collection & { source_count: number })[]
}

export default function CollectionsClient({ initialCollections }: CollectionsClientProps) {
  const [collections, setCollections] = useState(initialCollections)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const handleCreate = async () => {
    if (!newName.trim()) {
      alert('Collection name required')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          description: newDescription,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCollections([{ ...data.collection, source_count: 0 }, ...collections])
        setShowCreateModal(false)
        setNewName('')
        setNewDescription('')
      } else {
        alert('Failed to create collection')
      }
    } catch (error) {
      console.error('Create error:', error)
      alert('Failed to create collection')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Collections</h2>
          <p className="text-gray-600">{collections.length} total</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          + New Collection
        </Button>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No collections yet</h3>
          <p className="text-gray-600 mb-4">
            Create a collection to organize your sources
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Your First Collection
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <Link key={collection.id} href={`/collections/${collection.id}`}>
              <Card hover className="h-full">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {collection.name}
                  </h3>
                </CardHeader>
                <CardBody>
                  {collection.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {collection.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{collection.source_count} sources</span>
                    <span>{collection.is_public ? '🌐 Public' : '🔒 Private'}</span>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">New Collection</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="My Research Project"
                  disabled={creating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="What is this collection about?"
                  disabled={creating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewName('')
                  setNewDescription('')
                }}
                variant="secondary"
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                loading={creating}
              >
                Create Collection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
