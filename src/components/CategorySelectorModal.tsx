'use client'

import { useState, useEffect } from 'react'
import { X, Folder, Plus } from 'lucide-react'
import Button from './ui/Button'
import Input from './ui/Input'

interface Category {
  id: string
  name: string
  description?: string
  source_count: number
}

interface CategorySelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (categoryId: string | null, categoryName?: string) => void
  onCreateNew?: (name: string, description?: string) => Promise<string>
}

export default function CategorySelectorModal({
  isOpen,
  onClose,
  onSelect,
  onCreateNew
}: CategorySelectorModalProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDesc, setNewCategoryDesc] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/collections')
      const data = await res.json()
      setCategories(data.collections || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = () => {
    const category = categories.find(c => c.id === selectedId)
    onSelect(selectedId, category?.name)
    onClose()
  }

  const handleCreateNew = async () => {
    if (!newCategoryName.trim() || !onCreateNew) return

    try {
      setCreating(true)
      const newId = await onCreateNew(newCategoryName.trim(), newCategoryDesc.trim() || undefined)
      onSelect(newId, newCategoryName.trim())
      onClose()
    } catch (error) {
      console.error('Failed to create category:', error)
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Save to Collection</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          {!showCreateForm ? (
            <>
              {/* No Collection Option */}
              <button
                onClick={() => setSelectedId(null)}
                className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  selectedId === null
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Folder className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">No Collection</div>
                  <div className="text-sm text-gray-500">Save to general library</div>
                </div>
              </button>

              {/* Category List */}
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : categories.length > 0 ? (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedId(category.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        selectedId === category.id
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Folder className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-900">{category.name}</div>
                        <div className="text-sm text-gray-500">
                          {category.source_count || 0} sources
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Folder className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No categories yet</p>
                </div>
              )}

              {/* Create New Button */}
              {onCreateNew && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                >
                  <Plus className="h-5 w-5 text-indigo-600" />
                  <span className="font-medium text-indigo-600">Create New Collection</span>
                </button>
              )}
            </>
          ) : (
            /* Create Form */
            <div className="space-y-4">
              <div>
                <label htmlFor="collection-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Collection Name *
                </label>
                <Input
                  id="collection-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Research Papers, Work Notes"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="collection-desc" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="collection-desc"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="What's this collection for?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewCategoryName('')
                    setNewCategoryDesc('')
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateNew}
                  loading={creating}
                  disabled={!newCategoryName.trim()}
                  className="flex-1"
                >
                  Create
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!showCreateForm && (
          <div className="flex gap-3 p-6 border-t border-gray-200">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSelect} className="flex-1">
              Save
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
