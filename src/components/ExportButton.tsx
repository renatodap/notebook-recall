'use client'

import { useState } from 'react'
import Button from './ui/Button'
import { showError } from '@/lib/toast'

interface ExportButtonProps {
  sourceIds?: string[]
  className?: string
}

export default function ExportButton({ sourceIds, className }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const handleExport = async (format: 'markdown' | 'json') => {
    setIsExporting(true)
    setShowMenu(false)

    try {
      let url = `/api/export?format=${format}`

      if (sourceIds && sourceIds.length > 0) {
        url += `&sources=${sourceIds.join(',')}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Trigger download
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl

      const timestamp = new Date().toISOString().split('T')[0]
      a.download = `sources_export_${timestamp}.${format === 'markdown' ? 'md' : 'json'}`

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Export error:', error)
      showError('Failed to export sources. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        variant="secondary"
        aria-label="Export sources"
        aria-expanded={showMenu}
        aria-haspopup="menu"
      >
        {isExporting ? 'Exporting...' : '📥 Export'}
      </Button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
            aria-hidden="true"
          />

          {/* Menu */}
          <div
            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
            role="menu"
            aria-label="Export format options"
          >
            <button
              onClick={() => handleExport('markdown')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              role="menuitem"
              aria-label="Export as Markdown"
            >
              <span aria-hidden="true">📄</span>
              <span>Export as Markdown</span>
            </button>
            <button
              onClick={() => handleExport('json')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              role="menuitem"
              aria-label="Export as JSON"
            >
              <span aria-hidden="true">📊</span>
              <span>Export as JSON</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
