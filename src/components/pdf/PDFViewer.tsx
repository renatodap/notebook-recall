'use client'

import { useState, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import AnnotationToolbar from './AnnotationToolbar'
import AnnotationSidebar from './AnnotationSidebar'
import Button from '../ui/Button'

// Configure pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFAnnotation {
  id: string
  page_number: number
  annotation_type: 'highlight' | 'underline' | 'strikethrough'
  selected_text: string
  note: string
  color: string
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  created_at: string
}

interface PDFViewerProps {
  sourceId: string
  pdfUrl: string
}

export default function PDFViewer({ sourceId, pdfUrl }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [annotations, setAnnotations] = useState<PDFAnnotation[]>([])
  const [selectedTool, setSelectedTool] = useState<'highlight' | 'underline' | 'strikethrough' | null>(null)
  const [selectedColor, setSelectedColor] = useState<string>('#FFFF00')
  const [selection, setSelection] = useState<{ text: string; rect: DOMRect } | null>(null)
  const [showSidebar, setShowSidebar] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(true)

  // Fetch existing annotations
  useEffect(() => {
    fetchAnnotations()
  }, [sourceId])

  const fetchAnnotations = async () => {
    try {
      const res = await fetch(`/api/annotations?source_id=${sourceId}`)
      if (res.ok) {
        const data = await res.json()
        setAnnotations(data.annotations || [])
      }
    } catch (error) {
      console.error('Failed to fetch annotations:', error)
    }
  }

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
  }

  const handleTextSelection = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !selectedTool) return

    const text = sel.toString().trim()
    if (!text) return

    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    setSelection({ text, rect })
  }, [selectedTool])

  const createAnnotation = async (note: string = '') => {
    if (!selection) return

    try {
      const res = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_id: sourceId,
          page_number: pageNumber,
          annotation_type: selectedTool,
          selected_text: selection.text,
          note,
          color: selectedColor,
          position: {
            x: selection.rect.x,
            y: selection.rect.y,
            width: selection.rect.width,
            height: selection.rect.height
          }
        })
      })

      if (res.ok) {
        const data = await res.json()
        setAnnotations([...annotations, data.annotation])
        setSelection(null)
        window.getSelection()?.removeAllRanges()
      }
    } catch (error) {
      console.error('Failed to create annotation:', error)
    }
  }

  const deleteAnnotation = async (annotationId: string) => {
    try {
      const res = await fetch(`/api/annotations/${annotationId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setAnnotations(annotations.filter(a => a.id !== annotationId))
      }
    } catch (error) {
      console.error('Failed to delete annotation:', error)
    }
  }

  const pageAnnotations = annotations.filter(a => a.page_number === pageNumber)

  return (
    <div className="flex flex-col lg:flex-row h-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden relative">
      {/* Main PDF Viewer */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <AnnotationToolbar
          selectedTool={selectedTool}
          onToolSelect={setSelectedTool}
          selectedColor={selectedColor}
          onColorSelect={setSelectedColor}
          scale={scale}
          onScaleChange={setScale}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          sidebarOpen={showSidebar}
        />

        {/* PDF Display */}
        <div className="flex-1 overflow-auto bg-gray-100 p-2 sm:p-4 md:p-8">
          <div className="w-full lg:max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
            {loading && (
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-gray-600">Loading PDF...</span>
              </div>
            )}

            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading=""
              error={
                <div className="flex items-center justify-center h-96 text-red-600">
                  <div className="text-center">
                    <div className="text-4xl mb-2">⚠️</div>
                    <p>Failed to load PDF</p>
                  </div>
                </div>
              }
            >
              <div
                onMouseUp={handleTextSelection}
                className="relative"
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={false}
                />

                {/* Render custom annotations overlay */}
                {pageAnnotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: annotation.position.x,
                      top: annotation.position.y,
                      width: annotation.position.width,
                      height: annotation.position.height,
                      backgroundColor: annotation.color,
                      opacity: 0.3,
                      borderBottom: annotation.annotation_type === 'underline'
                        ? `2px solid ${annotation.color}`
                        : 'none',
                      textDecoration: annotation.annotation_type === 'strikethrough'
                        ? 'line-through'
                        : 'none'
                    }}
                  />
                ))}
              </div>
            </Document>

            {/* Quick annotation popup */}
            {selection && (
              <div
                className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-2 sm:p-3 animate-in fade-in zoom-in duration-200 max-w-[90vw]"
                style={{
                  left: Math.max(10, Math.min(selection.rect.x + selection.rect.width / 2 - 100, window.innerWidth - 210)),
                  top: Math.max(10, selection.rect.y - 60)
                }}
              >
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => createAnnotation()}
                    className="text-xs sm:text-sm"
                  >
                    ✓ <span className="hidden xs:inline">Annotate</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelection(null)
                      window.getSelection()?.removeAllRanges()
                    }}
                    className="text-xs sm:text-sm"
                  >
                    ✕ <span className="hidden xs:inline">Cancel</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Page Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mt-4 sm:mt-6 pb-4">
            <Button
              onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
              disabled={pageNumber <= 1}
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto"
            >
              ← <span className="hidden xs:inline">Previous</span><span className="xs:hidden">Prev</span>
            </Button>
            <span className="text-xs sm:text-sm text-gray-700 font-medium whitespace-nowrap">
              Page {pageNumber} of {numPages}
            </span>
            <Button
              onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
              disabled={pageNumber >= numPages}
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto"
            >
              <span className="hidden xs:inline">Next</span><span className="xs:hidden">Next</span> →
            </Button>
          </div>
        </div>
      </div>

      {/* Annotation Sidebar - Overlay on mobile, side-by-side on desktop */}
      {showSidebar && (
        <>
          {/* Mobile overlay backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
          <div className="fixed lg:relative inset-y-0 right-0 z-50 lg:z-0">
            <AnnotationSidebar
              annotations={pageAnnotations}
              onDeleteAnnotation={deleteAnnotation}
              currentPage={pageNumber}
              totalPages={numPages}
              onPageChange={setPageNumber}
              onClose={() => setShowSidebar(false)}
            />
          </div>
        </>
      )}
    </div>
  )
}
