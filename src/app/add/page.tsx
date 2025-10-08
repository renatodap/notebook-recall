'use client'

import { useState, useRef, DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import ChatSidebar from '@/components/ChatSidebar'
import Button from '@/components/ui/Button'
import CategorySelectorModal from '@/components/CategorySelectorModal'
import { ContentType } from '@/types'

type DetectedType = 'text' | 'url' | 'pdf' | 'image' | 'unknown'

export default function AddPage() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [detectedType, setDetectedType] = useState<DetectedType>('unknown')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [createdSourceId, setCreatedSourceId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const detectContentType = (text: string, file: File | null): DetectedType => {
    if (file) {
      if (file.type === 'application/pdf') return 'pdf'
      if (file.type.startsWith('image/')) return 'image'
    }
    if (!text.trim()) return 'unknown'
    try {
      const url = new URL(text.trim())
      if (url.protocol === 'http:' || url.protocol === 'https:') return 'url'
    } catch {}
    return 'text'
  }

  const handleInputChange = (value: string) => {
    setInput(value)
    setFile(null)
    setDetectedType(detectContentType(value, null))
  }

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setInput('')
    setDetectedType(detectContentType('', selectedFile))
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFileSelect(droppedFile)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const pastedFile = items[i].getAsFile()
        if (pastedFile) {
          e.preventDefault()
          handleFileSelect(pastedFile)
          return
        }
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      let content = ''
      let contentType: ContentType = 'text'
      let url: string | undefined
      const type = detectContentType(input, file)

      if (type === 'url') {
        const response = await fetch('/api/fetch-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: input.trim() }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        content = data.content
        url = input.trim()
        contentType = 'url'
      } else if (type === 'pdf' && file) {
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch('/api/process-pdf', {
          method: 'POST',
          body: formData,
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        content = data.content
        contentType = 'pdf'
      } else if (type === 'image' && file) {
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch('/api/process-image', {
          method: 'POST',
          body: formData,
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        content = data.content
        contentType = 'image'
      } else if (type === 'text') {
        content = input
        contentType = 'text'
      } else {
        throw new Error('Unable to detect content type. Please provide text, URL, or file.')
      }

      const summarizeRes = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, contentType }),
      })
      const summaryData = await summarizeRes.json()
      if (!summarizeRes.ok) throw new Error(summaryData.error)

      // Calculate word count from original content
      const wordCount = content.split(/\s+/).filter(w => w.length > 0).length

      const saveRes = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '',
          content_type: contentType,
          original_content: content,
          url,
          summary_text: summaryData.summary,
          key_actions: summaryData.actions || [],
          key_topics: summaryData.topics || [],
          word_count: wordCount,
        }),
      })
      const saveData = await saveRes.json()
      if (!saveRes.ok) {
        console.error('Save source error:', saveData)
        throw new Error(saveData.error || 'Failed to save source')
      }

      setInput('')
      setFile(null)
      setDetectedType('unknown')
      setSuccess(true)
      setCreatedSourceId(saveData.id)

      // Show category selector modal
      setShowCategoryModal(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCategorySelect = async (categoryId: string | null) => {
    if (!createdSourceId) return

    try {
      // If category is selected, link source to collection
      if (categoryId) {
        const response = await fetch(`/api/collections/${categoryId}/sources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_id: createdSourceId
          })
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to add source to category')
        }
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Error adding to category:', err)
      // Still redirect even if category link fails
      router.push('/dashboard')
    }
  }

  const handleCreateCategory = async (name: string, description?: string): Promise<string> => {
    const response = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    })

    if (!response.ok) {
      throw new Error('Failed to create category')
    }

    const data = await response.json()
    return data.id
  }

  const getTypeIndicator = () => {
    if (detectedType === 'unknown') return null
    const icons: Record<DetectedType, string> = {
      text: '📝', url: '🔗', pdf: '📄', image: '🖼️', unknown: ''
    }
    const labels: Record<DetectedType, string> = {
      text: 'Text', url: 'URL', pdf: 'PDF', image: 'Image', unknown: ''
    }
    const descriptions: Record<DetectedType, string> = {
      text: 'Will extract and summarize text',
      url: 'Will fetch and analyze webpage',
      pdf: 'Will extract text from PDF',
      image: 'Will extract text via OCR',
      unknown: ''
    }
    return (
      <div className="absolute top-3 right-3 px-4 py-2 rounded-lg text-sm font-medium shadow-sm border flex items-center gap-2"
           style={{
             backgroundColor: 'rgba(16, 163, 127, 0.1)',
             borderColor: 'var(--chat-accent)',
             color: 'var(--chat-accent)'
           }}>
        <span className="text-lg">{icons[detectedType]}</span>
        <div className="text-left">
          <div className="font-semibold">Detected: {labels[detectedType]}</div>
          <div className="text-xs" style={{ color: 'var(--chat-text-secondary)' }}>{descriptions[detectedType]}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--chat-bg-main)' }}>
      <ChatSidebar />

      <div className="flex-1 flex flex-col md:ml-64 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8 md:py-12 w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--chat-text-primary)' }}>Add Content</h1>
            <p style={{ color: 'var(--chat-text-secondary)' }}>
            Paste text, drop a file, or enter a URL. AI will summarize it instantly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-2xl transition-all ${
              isDragging
                ? 'scale-[1.02]'
                : ''
            }`}
            style={{
              borderColor: isDragging ? 'var(--chat-accent)' : 'var(--chat-border)',
              backgroundColor: isDragging ? 'rgba(16, 163, 127, 0.1)' : 'var(--chat-bg-input)'
            }}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {getTypeIndicator()}

            <textarea
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onPaste={handlePaste}
              placeholder="Paste text, URL, or drop a file here..."
              className="w-full p-6 border-0 rounded-2xl focus:outline-none focus:ring-0 resize-none bg-transparent text-lg"
              style={{ color: 'var(--chat-text-primary)' }}
              rows={8}
              disabled={loading || !!file}
            />

            {file && (
              <div className="px-6 pb-6 pt-0">
                <div className="flex items-center justify-between p-4 rounded-xl border"
                     style={{
                       backgroundColor: 'var(--chat-bg-message-ai)',
                       borderColor: 'var(--chat-border)'
                     }}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {file.type === 'application/pdf' ? '📄' : '🖼️'}
                    </span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--chat-text-primary)' }}>{file.name}</p>
                      <p className="text-xs" style={{ color: 'var(--chat-text-secondary)' }}>
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null)
                      setDetectedType('unknown')
                    }}
                    className="text-red-400 hover:text-red-300 text-sm font-medium px-3 py-1 rounded-lg transition-colors"
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* File Upload Button */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="flex-1"
            >
              <span className="text-lg mr-2">📎</span>
              Choose File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/jpeg,image/png,image/gif,image/webp"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0]
                if (selectedFile) handleFileSelect(selectedFile)
              }}
              className="hidden"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 border rounded-xl" style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.3)'
            }}>
              <p className="text-sm font-medium" style={{ color: '#FCA5A5' }}>{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 border rounded-xl" style={{
              backgroundColor: 'rgba(16, 163, 127, 0.1)',
              borderColor: 'rgba(16, 163, 127, 0.3)'
            }}>
              <p className="text-sm font-medium" style={{ color: 'var(--chat-accent)' }}>
                ✓ Content saved! Redirecting to sources...
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            loading={loading}
            className="w-full h-14 text-lg font-semibold"
            disabled={!input.trim() && !file}
            aria-label={loading ? 'Processing content' : 'Add content to library'}
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin mr-2" aria-hidden="true">⚙️</span>
                Processing...
              </>
            ) : (
              <>
                <span className="mr-2" aria-hidden="true">⚡</span>
                Add to Library
              </>
            )}
          </Button>
        </form>

        {/* Helper Text */}
        <div className="mt-6 p-4 border rounded-xl" style={{
          backgroundColor: 'var(--chat-bg-message-ai)',
          borderColor: 'var(--chat-border)'
        }}>
          <p className="text-sm" style={{ color: 'var(--chat-text-secondary)' }}>
            <strong style={{ color: 'var(--chat-text-primary)' }}>Tip:</strong> Titles are auto-generated, but you can edit them later.
            Supported formats: Text, URLs, PDFs, and images (JPG, PNG, GIF, WebP).
          </p>
        </div>
      </div>
    </div>

      {/* Category Selector Modal */}
      <CategorySelectorModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false)
          router.push('/dashboard')
        }}
        onSelect={handleCategorySelect}
        onCreateNew={handleCreateCategory}
      />
    </div>
  )
}
