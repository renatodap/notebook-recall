'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Circle, Sparkles, AlertCircle, RefreshCw } from 'lucide-react'
import { QUICK_WINS } from '@/lib/onboarding/quick-wins'

interface QuickWinsTrackerProps {
  variant?: 'full' | 'compact'
  className?: string
}

/**
 * Quick Wins Tracker Component
 *
 * Displays user progress through onboarding milestones
 *
 * CLAUDE.MD COMPLIANCE:
 * - ✅ ARIA labels for accessibility
 * - ✅ Keyboard navigation support
 * - ✅ Proper loading states
 * - ✅ Error handling with retry
 * - ✅ Semantic HTML
 * - ✅ Screen reader friendly
 */
export default function QuickWinsTracker({ variant = 'full', className = '' }: QuickWinsTrackerProps) {
  const [completedWins, setCompletedWins] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchQuickWins()
  }, [])

  async function fetchQuickWins() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/quick-wins')
      if (!response.ok) {
        throw new Error(`Failed to fetch quick wins: ${response.statusText}`)
      }

      const data = await response.json()
      const completed = new Set<string>(
        data.wins.filter((w: any) => w.completed).map((w: any) => w.win_id as string)
      )
      setCompletedWins(completed)
    } catch (err) {
      console.error('Error fetching quick wins:', err)
      setError(err instanceof Error ? err.message : 'Failed to load progress')
    } finally {
      setIsLoading(false)
    }
  }

  const progress = (completedWins.size / QUICK_WINS.length) * 100
  const nextWin = QUICK_WINS.find((win) => !completedWins.has(win.id))

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className={`bg-white rounded-lg border border-neutral-200 p-4 ${className}`}
        role="status"
        aria-label="Loading quick wins progress"
      >
        <div className="animate-pulse space-y-3">
          <div className="flex items-center justify-between mb-2">
            <div className="h-5 w-32 bg-neutral-200 rounded" />
            <div className="h-5 w-16 bg-neutral-200 rounded" />
          </div>
          <div className="h-2 bg-neutral-200 rounded-full" />
          {variant === 'full' && (
            <div className="h-4 w-48 bg-neutral-200 rounded mt-2" />
          )}
        </div>
        <span className="sr-only">Loading your progress...</span>
      </div>
    )
  }

  // Error state with retry
  if (error) {
    return (
      <div
        className={`bg-white rounded-lg border border-error-200 p-4 ${className}`}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-error-600 flex-shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-medium text-error-900">Unable to load progress</p>
            <p className="text-xs text-error-700 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchQuickWins}
            className="flex items-center gap-2 px-3 py-2 bg-error-50 text-error-700 rounded-lg hover:bg-error-100 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2"
            aria-label="Retry loading progress"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Don't show if all completed
  if (completedWins.size === QUICK_WINS.length) {
    return null
  }

  // Compact variant - just progress bar
  if (variant === 'compact') {
    return (
      <div className={`bg-white rounded-lg border border-neutral-200 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary-600" aria-hidden="true" />
            <span className="text-sm font-semibold text-neutral-900">Quick Wins</span>
          </div>
          <span className="text-sm text-neutral-600" aria-label={`${completedWins.size} of ${QUICK_WINS.length} wins completed`}>
            {completedWins.size}/{QUICK_WINS.length}
          </span>
        </div>
        <div
          className="h-2 bg-neutral-200 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={completedWins.size}
          aria-valuemin={0}
          aria-valuemax={QUICK_WINS.length}
          aria-label="Quick wins progress"
        >
          <div
            className="h-full bg-primary-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {nextWin && (
          <p className="text-xs text-neutral-600 mt-2">
            <span className="font-medium">Next:</span> {nextWin.title}
          </p>
        )}
      </div>
    )
  }

  // Full variant - expandable checklist
  return (
    <div
      className={`bg-gradient-to-br from-primary-50 to-white rounded-lg border border-primary-200 overflow-hidden ${className}`}
      role="region"
      aria-label="Quick wins progress tracker"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
        aria-expanded={isExpanded}
        aria-controls="quick-wins-list"
        aria-label={`Quick wins tracker. ${completedWins.size} of ${QUICK_WINS.length} completed. ${isExpanded ? 'Collapse' : 'Expand'} details.`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center" aria-hidden="true">
            <Sparkles className="h-5 w-5 text-primary-600" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-neutral-900">Quick Wins</h3>
            <p className="text-xs text-neutral-600">
              {completedWins.size} of {QUICK_WINS.length} completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-primary-600" aria-label={`${Math.round(progress)} percent complete`}>
            {Math.round(progress)}%
          </span>
          <svg
            className={`h-5 w-5 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Progress Bar */}
      <div className="px-4 pb-4">
        <div
          className="h-2 bg-neutral-200 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={completedWins.size}
          aria-valuemin={0}
          aria-valuemax={QUICK_WINS.length}
          aria-label="Quick wins progress"
        >
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Expandable Checklist */}
      {isExpanded && (
        <div
          id="quick-wins-list"
          className="px-4 pb-4 space-y-2"
          role="list"
          aria-label="Quick wins checklist"
        >
          {QUICK_WINS.map((win) => {
            const isCompleted = completedWins.has(win.id)
            return (
              <div
                key={win.id}
                role="listitem"
                aria-label={`${win.title}. ${win.description}. ${isCompleted ? 'Completed' : 'Not completed'}`}
                className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                  isCompleted
                    ? 'bg-success-50 border border-success-200'
                    : 'bg-white border border-neutral-200 hover:border-primary-300'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5" aria-hidden="true">
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-success-700" />
                  ) : (
                    <Circle className="h-5 w-5 text-neutral-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base" aria-hidden="true">{win.icon}</span>
                    <p className={`text-sm font-medium ${isCompleted ? 'text-success-900 line-through' : 'text-neutral-900'}`}>
                      {win.title}
                    </p>
                  </div>
                  <p className={`text-xs mt-0.5 ${isCompleted ? 'text-success-700' : 'text-neutral-600'}`}>
                    {win.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Next Win CTA (when collapsed) */}
      {!isExpanded && nextWin && (
        <div className="px-4 pb-4">
          <div className="bg-white rounded-lg border border-neutral-200 p-3 flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">{nextWin.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-900">
                <span className="text-neutral-600">Next:</span> {nextWin.title}
              </p>
              <p className="text-xs text-neutral-600">{nextWin.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
