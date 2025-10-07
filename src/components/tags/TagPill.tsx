'use client'

interface TagPillProps {
  tagName: string
  count?: number
  selected?: boolean
  onClick?: () => void
  onRemove?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export default function TagPill({
  tagName,
  count,
  selected = false,
  onClick,
  onRemove,
  size = 'md',
}: TagPillProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  const baseClasses = 'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors'
  const colorClasses = selected
    ? 'bg-blue-500 text-white hover:bg-blue-600'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  const cursorClass = onClick ? 'cursor-pointer' : ''

  // Use button for clickable tags, span for display-only tags
  const Component = onClick ? 'button' : 'span'
  const buttonProps = onClick ? {
    type: 'button' as const,
    onClick,
    'aria-pressed': selected,
    'aria-label': `${selected ? 'Deselect' : 'Select'} tag ${tagName}${count !== undefined ? ` (${count} items)` : ''}`
  } : {}

  return (
    <Component
      className={`${baseClasses} ${colorClasses} ${sizeClasses[size]} ${cursorClass}`}
      {...buttonProps}
    >
      <span>{tagName}</span>
      {count !== undefined && (
        <span className={selected ? 'text-blue-100' : 'text-gray-500'} aria-hidden="true">
          ({count})
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="hover:bg-white/20 rounded-full p-0.5"
          aria-label={`Remove tag ${tagName}`}
        >
          ×
        </button>
      )}
    </Component>
  )
}
