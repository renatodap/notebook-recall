'use client'

import { useState, useRef } from 'react'
import Button from '../ui/Button'
import { Card, CardBody, CardHeader } from '../ui/Card'

interface ImportedReference {
  title: string
  authors?: string[]
  year?: number
  abstract?: string
  doi?: string
  journal?: string
  type?: string
  url?: string
}

interface ImportResult {
  references: ImportedReference[]
  format: 'bibtex' | 'ris' | 'endnote' | 'unknown'
  totalParsed: number
  errors: string[]
}

export default function ReferenceImporter({ onImportComplete }: { onImportComplete?: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(null)
      setError('')
      setSuccess('')
    }
  }

  const parseFile = async () => {
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('create_sources', 'false') // Just preview first

      const res = await fetch('/api/import/references', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to parse file')
      }

      const data = await res.json()
      setPreview(data.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
    } finally {
      setUploading(false)
    }
  }

  const confirmImport = async () => {
    if (!file) return

    setImporting(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('create_sources', 'true') // Actually import

      const res = await fetch('/api/import/references', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to import references')
      }

      const data = await res.json()
      setSuccess(`Successfully imported ${data.createdSources} sources!`)
      setFile(null)
      setPreview(null)

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      if (onImportComplete) {
        setTimeout(onImportComplete, 1500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import references')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto shadow-xl">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-3xl">📚</span>
          Import Reference Library
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Import from Zotero, Mendeley, or EndNote (BibTeX, RIS, EndNote XML)
        </p>
      </CardHeader>

      <CardBody className="p-6">
        {/* File Upload Section */}
        {!preview && (
          <div>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                file
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".bib,.ris,.xml"
                onChange={handleFileSelect}
                className="hidden"
                id="reference-file"
              />

              {file ? (
                <div className="space-y-3">
                  <div className="text-5xl">✓</div>
                  <div>
                    <p className="font-semibold text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-600">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={parseFile}
                      disabled={uploading}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {uploading ? 'Parsing...' : '🔍 Preview References'}
                    </Button>
                    <label htmlFor="reference-file" className="cursor-pointer">
                      <span className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                        Choose Different File
                      </span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-5xl">📁</div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 mb-1">
                      Drop your reference file here
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      or click to browse
                    </p>
                  </div>
                  <label htmlFor="reference-file" className="cursor-pointer">
                    <span className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Browse Files
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported: .bib (BibTeX), .ris (RIS), .xml (EndNote)
                  </p>
                </div>
              )}
            </div>

            {/* Format Examples */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-semibold text-sm text-blue-900 mb-1">📘 Zotero</p>
                <p className="text-xs text-blue-700">Export as BibTeX (.bib)</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="font-semibold text-sm text-green-900 mb-1">📗 Mendeley</p>
                <p className="text-xs text-green-700">Export as BibTeX or RIS</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="font-semibold text-sm text-purple-900 mb-1">📕 EndNote</p>
                <p className="text-xs text-purple-700">Export as RIS or XML</p>
              </div>
            </div>
          </div>
        )}

        {/* Preview Section */}
        {preview && (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div>
                <p className="text-sm text-gray-600">Detected Format</p>
                <p className="text-xl font-bold text-gray-900 uppercase">{preview.format}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">References Found</p>
                <p className="text-3xl font-bold text-green-600">{preview.totalParsed}</p>
              </div>
            </div>

            {/* Errors */}
            {preview.errors.length > 0 && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="font-semibold text-yellow-900 mb-2">⚠️ Parsing Warnings:</p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {preview.errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reference Preview (first 5) */}
            <div>
              <p className="font-semibold text-gray-900 mb-3">Preview (first 5 references):</p>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {preview.references.slice(0, 5).map((ref, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
                    <p className="font-semibold text-gray-900">{ref.title || 'Untitled'}</p>
                    {ref.authors && ref.authors.length > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        👥 {ref.authors.join(', ')}
                      </p>
                    )}
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      {ref.year && <span>📅 {ref.year}</span>}
                      {ref.journal && <span>📰 {ref.journal}</span>}
                      {ref.type && <span className="capitalize">📝 {ref.type}</span>}
                    </div>
                    {ref.doi && (
                      <p className="text-xs text-indigo-600 mt-1">
                        🔗 DOI: {ref.doi}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {preview.references.length > 5 && (
                <p className="text-sm text-gray-600 mt-2 text-center">
                  + {preview.references.length - 5} more references will be imported
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                onClick={confirmImport}
                disabled={importing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {importing ? 'Importing...' : `✓ Import ${preview.totalParsed} References`}
              </Button>
              <Button
                onClick={() => {
                  setPreview(null)
                  setFile(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                variant="ghost"
                disabled={importing}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-900">❌ {error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-900">✅ {success}</p>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
