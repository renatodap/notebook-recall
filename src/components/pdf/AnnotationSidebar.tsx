'use client'

import { useState } from 'react'
import Button from '../ui/Button'
import Textarea from '../ui/Textarea'
import { Card, CardBody } from '../ui/Card'

interface PDFAnnotation {
  id: string
  page_number: number
  annotation_type: 'highlight' | 'underline' | 'strikethrough'
  selected_text: string
  note: string
  color: string
  position: any
  created_at: string
}

interface AnnotationSidebarProps {
  annotations: PDFAnnotation[]
  onDeleteAnnotation: (id: string) => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onClose?: () => void
}

export default function AnnotationSidebar({
  annotations,
  onDeleteAnnotation,
  currentPage,
  totalPages,
  onPageChange,
  onClose
}: AnnotationSidebarProps) {
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [editText, setEditText] = useState<string>('')

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedNotes)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedNotes(newExpanded)
  }

  const startEditing = (annotation: PDFAnnotation) => {
    setEditingNote(annotation.id)
    setEditText(annotation.note)
  }

  const saveNote = async (annotationId: string) => {
    try {
      await fetch(`/api/annotations/${annotationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: editText })
      })
      setEditingNote(null)
      // Trigger refresh - parent component should refetch
    } catch (error) {
      console.error('Failed to update note:', error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'highlight': return '🖍️'
      case 'underline': return '_'
      case 'strikethrough': return '~'
      default: return '📝'
    }
  }

  const sortedAnnotations = [...annotations].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="w-full sm:w-96 lg:w-80 bg-white border-l border-gray-200 flex flex-col h-full shadow-xl lg:shadow-none">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-lg">📝</span>
            <span>Annotations</span>
            <span className="ml-2 text-sm font-normal text-gray-600">
              ({annotations.length})
            </span>
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-200 rounded-full transition-colors"
              aria-label="Close sidebar"
            >
              <span className="text-xl">✕</span>
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500">Page {currentPage} of {totalPages}</p>
      </div>

      {/* Annotations List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {sortedAnnotations.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">📌</div>
            <p className="text-sm">No annotations on this page</p>
            <p className="text-xs mt-1">Select text and choose a tool to annotate</p>
          </div>
        ) : (
          sortedAnnotations.map((annotation) => (
            <Card key={annotation.id} className="hover:shadow-md transition-shadow">
              <CardBody className="p-3">
                {/* Annotation Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{getTypeIcon(annotation.annotation_type)}</span>
                    <div
                      className="w-3 h-3 rounded border border-gray-300"
                      style={{ backgroundColor: annotation.color }}
                      title={`${annotation.annotation_type} color`}
                    />
                  </div>
                  <div className="flex gap-1">
                    {!editingNote && (
                      <button
                        onClick={() => startEditing(annotation)}
                        className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                        title="Edit note"
                      >
                        ✏️
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('Delete this annotation?')) {
                          onDeleteAnnotation(annotation.id)
                        }
                      }}
                      className="text-xs text-red-600 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded transition-colors"
                      title="Delete annotation"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Selected Text */}
                <div
                  className={`text-sm text-gray-700 mb-2 p-2 rounded ${
                    annotation.selected_text.length > 100 && !expandedNotes.has(annotation.id)
                      ? 'cursor-pointer hover:bg-gray-50'
                      : ''
                  }`}
                  style={{
                    backgroundColor: annotation.color + '20',
                    borderLeft: `3px solid ${annotation.color}`
                  }}
                  onClick={() => {
                    if (annotation.selected_text.length > 100) {
                      toggleExpanded(annotation.id)
                    }
                  }}
                >
                  <p className="italic">
                    {expandedNotes.has(annotation.id) || annotation.selected_text.length <= 100
                      ? annotation.selected_text
                      : annotation.selected_text.substring(0, 100) + '...'}
                  </p>
                  {annotation.selected_text.length > 100 && (
                    <button className="text-xs text-indigo-600 hover:text-indigo-700 mt-1">
                      {expandedNotes.has(annotation.id) ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>

                {/* Note */}
                {editingNote === annotation.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      placeholder="Add your note here..."
                      rows={3}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveNote(annotation.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingNote(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : annotation.note ? (
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border-l-2 border-gray-300">
                    <p className="font-medium text-gray-700 mb-1">💭 Your note:</p>
                    <p className="whitespace-pre-wrap">{annotation.note}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditing(annotation)}
                    className="text-xs text-gray-400 hover:text-gray-600 italic"
                  >
                    + Add a note
                  </button>
                )}

                {/* Timestamp */}
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(annotation.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 space-y-2">
        <Button
          size="sm"
          variant="secondary"
          className="w-full"
          onClick={() => {
            // Export annotations logic
            const annotationsText = annotations.map(a =>
              `[${a.annotation_type.toUpperCase()}] ${a.selected_text}\n${a.note ? `Note: ${a.note}\n` : ''}\n`
            ).join('\n')

            const blob = new Blob([annotationsText], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `annotations-page-${currentPage}.txt`
            a.click()
          }}
        >
          📥 Export Page Annotations
        </Button>

        <div className="text-xs text-center text-gray-500">
          Tip: Select text and click a tool to annotate
        </div>
      </div>
    </div>
  )
}
