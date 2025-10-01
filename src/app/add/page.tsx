'use client'

import { useState, useRef, DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import MobileNav from '@/components/MobileNav'
import Button from '@/components/ui/Button'
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

      const saveRes = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '',
          content_type: contentType,
          original_content: content,
          url,
          summary_text: summaryData.summary,
          key_actions: summaryData.actions,
          key_topics: summaryData.topics,
          word_count: summaryData.summary.split(' ').length,
        }),
      })
      if (!saveRes.ok) throw new Error('Failed to save source')

      setInput('')
      setFile(null)
      setDetectedType('unknown')
      setSuccess(true)

      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getTypeIndicator = () => {
    if (detectedType === 'unknown') return null
    const icons: Record<DetectedType, string> = {
      text: '📝', url: '🔗', pdf: '📄', image: '🖼️', unknown: ''
    }
    const labels: Record<DetectedType, string> = {
      text: 'Text', url: 'URL', pdf: 'PDF', image: 'Image', unknown: ''
    }
    return (
      <div className="absolute top-3 right-3 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm">
        {icons[detectedType]} {labels[detectedType]}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64">
      <MobileNav />

      <div className="max-w-2xl mx-auto px-4 py-6 md:py-12">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Content</h1>
          <p className="text-gray-600">
            Paste text, drop a file, or enter a URL. We&apos;ll handle the rest.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-2xl transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50 scale-[1.02]'
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
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
              rows={8}
              disabled={loading || !!file}
            />

            {file && (
              <div className="px-6 pb-6 pt-0">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {file.type === 'application/pdf' ? '📄' : '🖼️'}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
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
                    className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
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
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-600 font-medium">
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
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin mr-2">⚙️</span>
                Processing...
              </>
            ) : (
              <>
                <span className="mr-2">⚡</span>
                Add to Library
              </>
            )}
          </Button>
        </form>

        {/* Helper Text */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Titles are auto-generated, but you can edit them later.
            Supported formats: Text, URLs, PDFs, and images (JPG, PNG, GIF, WebP).
          </p>
        </div>
      </div>
    </div>
  )
}
