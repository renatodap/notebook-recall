'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from './ui/Input'
import Textarea from './ui/Textarea'
import Button from './ui/Button'
import { Card, CardBody } from './ui/Card'
import { ContentType } from '@/types'

type Tab = 'text' | 'url' | 'pdf' | 'image'

export default function ContentIngestion() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('text')
  const [title, setTitle] = useState('')
  const [textContent, setTextContent] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let content = ''
      let contentType: ContentType = 'text'
      let finalUrl: string | undefined

      if (activeTab === 'text') {
        content = textContent
        contentType = 'text'
      } else if (activeTab === 'url') {
        // Fetch URL content
        const response = await fetch('/api/fetch-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        content = data.content
        finalUrl = url
        contentType = 'url'
        setTitle(title || data.title)
      } else if (activeTab === 'pdf' && file) {
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
        setTitle(title || data.title)
      } else if (activeTab === 'image' && file) {
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
        setTitle(title || data.title)
      }

      // Summarize content
      const summarizeRes = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, contentType }),
      })
      const summaryData = await summarizeRes.json()
      if (!summarizeRes.ok) throw new Error(summaryData.error)

      // Save source
      const saveRes = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Untitled',
          content_type: contentType,
          original_content: content,
          url: finalUrl,
          summary_text: summaryData.summary,
          key_actions: summaryData.actions,
          key_topics: summaryData.topics,
          word_count: summaryData.summary.split(' ').length,
        }),
      })
      if (!saveRes.ok) throw new Error('Failed to save source')

      // Reset form
      setTitle('')
      setTextContent('')
      setUrl('')
      setFile(null)
      router.refresh()
      alert('Content saved successfully!')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardBody>
        <h2 className="text-xl font-semibold mb-4">Add New Content</h2>

        <div className="flex gap-2 mb-4 border-b">
          {['text', 'url', 'pdf', 'image'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as Tab)}
              className={`px-4 py-2 font-medium capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title..."
            disabled={loading}
          />

          {activeTab === 'text' && (
            <Textarea
              label="Content"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste your text content here..."
              rows={10}
              required
              disabled={loading}
            />
          )}

          {activeTab === 'url' && (
            <Input
              type="url"
              label="URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              required
              disabled={loading}
            />
          )}

          {activeTab === 'pdf' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PDF File <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                disabled={loading}
                className="w-full"
              />
            </div>
          )}

          {activeTab === 'image' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image File <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                disabled={loading}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPG, PNG, GIF, WebP
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Process & Save
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}
