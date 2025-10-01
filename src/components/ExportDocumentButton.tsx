'use client'

import { useState } from 'react'
import Button from './ui/Button'
import { Card, CardBody } from './ui/Card'

interface ExportDocumentButtonProps {
  sourceId: string
}

export default function ExportDocumentButton({ sourceId }: ExportDocumentButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const exportDocument = async (format: 'markdown' | 'latex' | 'docx') => {
    setExporting(true)
    try {
      const res = await fetch('/api/export/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_id: sourceId, format })
      })

      if (!res.ok) throw new Error('Export failed')

      if (format === 'docx') {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `document.docx`
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        const data = await res.json()
        const blob = new Blob([data.content], { type: 'text/plain' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = data.filename
        a.click()
        window.URL.revokeObjectURL(url)
      }

      setIsOpen(false)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="secondary"
        size="sm"
      >
        📥 Export
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md shadow-2xl">
              <CardBody className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Export Document</h3>
                <p className="text-gray-600 mb-6">Choose your preferred format</p>

                <div className="space-y-3">
                  <button
                    onClick={() => exportDocument('markdown')}
                    disabled={exporting}
                    className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">📝</span>
                      <div>
                        <p className="font-semibold text-gray-900">Markdown</p>
                        <p className="text-sm text-gray-600">Plain text with formatting (.md)</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => exportDocument('latex')}
                    disabled={exporting}
                    className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">📄</span>
                      <div>
                        <p className="font-semibold text-gray-900">LaTeX</p>
                        <p className="text-sm text-gray-600">Academic paper format (.tex)</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => exportDocument('docx')}
                    disabled={exporting}
                    className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">📘</span>
                      <div>
                        <p className="font-semibold text-gray-900">Word Document</p>
                        <p className="text-sm text-gray-600">Microsoft Word format (.docx)</p>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="mt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    className="w-full"
                    disabled={exporting}
                  >
                    Cancel
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
