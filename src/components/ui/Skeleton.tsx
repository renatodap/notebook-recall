/**
 * Skeleton Loading Components
 *
 * Production-level loading states for all major UI components.
 * Per CLAUDE.md Section 5: Loading States are required for all async operations.
 */

export function Skeleton({
  className = '',
  style
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`animate-pulse bg-neutral-200 rounded ${className}`}
      style={style}
      role="status"
      aria-label="Loading..."
    />
  )
}

/**
 * Skeleton for individual source cards
 */
export function SourceCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Icon placeholder */}
        <Skeleton className="h-8 w-8 flex-shrink-0" />

        <div className="flex-1 space-y-3">
          {/* Title */}
          <Skeleton className="h-6 w-3/4" />

          {/* Summary text */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          {/* Tags */}
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>

        {/* Date */}
        <Skeleton className="h-4 w-20 flex-shrink-0" />
      </div>
    </div>
  )
}

/**
 * Skeleton for list of sources
 */
export function SourceListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SourceCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton for dashboard page
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Stats cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sources list */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <SourceListSkeleton count={5} />
      </div>
    </div>
  )
}

/**
 * Skeleton for charts and visualizations
 */
export function ChartSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-neutral-200 p-6 ${height}`}>
      <div className="space-y-4 h-full flex flex-col">
        {/* Chart title */}
        <Skeleton className="h-6 w-48" />

        {/* Chart area */}
        <div className="flex-1 flex items-end gap-2">
          {[60, 80, 45, 90, 70, 55].map((height, i) => (
            <Skeleton
              key={i}
              className="flex-1"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for tag filters
 */
export function TagFilterSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-4">
      {/* Header */}
      <Skeleton className="h-5 w-32" />

      {/* Tag pills */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for synthesis report
 */
export function SynthesisReportSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="p-4 bg-neutral-50 rounded">
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  )
}

/**
 * Inline spinner for buttons and small areas
 */
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div
      className={`${sizeClasses[size]} border-2 border-neutral-300 border-t-primary-600 rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  )
}

/**
 * Loading overlay for full-page loading states
 */
export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-live="polite"
      aria-label={message}
    >
      <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-neutral-700 font-medium">{message}</p>
      </div>
    </div>
  )
}
