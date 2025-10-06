import { ReactNode } from 'react'
import Link from 'next/link'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  primaryAction?: {
    label: string
    href?: string
    onClick?: () => void
  }
  secondaryAction?: {
    label: string
    href?: string
    onClick?: () => void
  }
  suggestions?: string[]
  className?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  suggestions,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`bg-white rounded-lg border border-neutral-200 p-12 text-center ${className}`}>
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-neutral-100 rounded-full text-neutral-600">{icon}</div>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-neutral-900 mb-3">{title}</h3>

      {/* Description */}
      <p className="text-neutral-600 max-w-md mx-auto mb-8">{description}</p>

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex gap-4 justify-center mb-6">
          {primaryAction && (
            <>
              {primaryAction.href ? (
                <Link
                  href={primaryAction.href}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                >
                  {primaryAction.label}
                </Link>
              ) : (
                <button
                  onClick={primaryAction.onClick}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                >
                  {primaryAction.label}
                </button>
              )}
            </>
          )}

          {secondaryAction && (
            <>
              {secondaryAction.href ? (
                <Link
                  href={secondaryAction.href}
                  className="px-6 py-3 bg-white text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
                >
                  {secondaryAction.label}
                </Link>
              ) : (
                <button
                  onClick={secondaryAction.onClick}
                  className="px-6 py-3 bg-white text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
                >
                  {secondaryAction.label}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="bg-neutral-50 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm font-semibold text-neutral-700 mb-3">💡 Suggestions:</p>
          <ul className="text-sm text-neutral-600 space-y-2 text-left">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-neutral-400 mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
