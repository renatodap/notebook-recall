'use client'

import Button from '../ui/Button'

interface AnnotationToolbarProps {
  selectedTool: 'highlight' | 'underline' | 'strikethrough' | null
  onToolSelect: (tool: 'highlight' | 'underline' | 'strikethrough' | null) => void
  selectedColor: string
  onColorSelect: (color: string) => void
  scale: number
  onScaleChange: (scale: number) => void
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

const COLORS = [
  { name: 'Yellow', value: '#FFFF00' },
  { name: 'Green', value: '#00FF00' },
  { name: 'Blue', value: '#00BFFF' },
  { name: 'Pink', value: '#FFB6C1' },
  { name: 'Orange', value: '#FFA500' },
  { name: 'Purple', value: '#DDA0DD' }
]

export default function AnnotationToolbar({
  selectedTool,
  onToolSelect,
  selectedColor,
  onColorSelect,
  scale,
  onScaleChange,
  onToggleSidebar,
  sidebarOpen
}: AnnotationToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
      {/* Annotation Tools */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 mr-2">Tools:</span>

        <Button
          size="sm"
          variant={selectedTool === 'highlight' ? 'primary' : 'secondary'}
          onClick={() => onToolSelect(selectedTool === 'highlight' ? null : 'highlight')}
          className="flex items-center gap-1"
        >
          <span className="text-base">🖍️</span>
          <span className="hidden sm:inline">Highlight</span>
        </Button>

        <Button
          size="sm"
          variant={selectedTool === 'underline' ? 'primary' : 'secondary'}
          onClick={() => onToolSelect(selectedTool === 'underline' ? null : 'underline')}
          className="flex items-center gap-1"
        >
          <span className="text-base">_</span>
          <span className="hidden sm:inline">Underline</span>
        </Button>

        <Button
          size="sm"
          variant={selectedTool === 'strikethrough' ? 'primary' : 'secondary'}
          onClick={() => onToolSelect(selectedTool === 'strikethrough' ? null : 'strikethrough')}
          className="flex items-center gap-1"
        >
          <span className="text-base">~</span>
          <span className="hidden sm:inline">Strike</span>
        </Button>

        {/* Color Picker */}
        {selectedTool && (
          <div className="flex items-center gap-1 ml-4 border-l pl-4">
            <span className="text-xs text-gray-600 mr-1">Color:</span>
            {COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => onColorSelect(color.value)}
                className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                  selectedColor === color.value ? 'border-gray-800 ring-2 ring-offset-1 ring-gray-400' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
                aria-label={`Select ${color.name} color`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Zoom and Sidebar Controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 border-r pr-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onScaleChange(Math.max(0.5, scale - 0.1))}
            disabled={scale <= 0.5}
            title="Zoom out"
          >
            −
          </Button>
          <span className="text-xs text-gray-600 w-12 text-center font-medium">
            {Math.round(scale * 100)}%
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onScaleChange(Math.min(2.0, scale + 0.1))}
            disabled={scale >= 2.0}
            title="Zoom in"
          >
            +
          </Button>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={onToggleSidebar}
          className="flex items-center gap-1"
        >
          <span className="text-base">{sidebarOpen ? '▶' : '◀'}</span>
          <span className="hidden sm:inline">{sidebarOpen ? 'Hide' : 'Show'} Notes</span>
        </Button>
      </div>
    </div>
  )
}
