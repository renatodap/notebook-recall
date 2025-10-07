import MobileNav from '@/components/MobileNav'

export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20 md:pb-0 md:pl-64">
      <MobileNav />

      <div className="max-w-6xl mx-auto px-6 py-8 md:py-12" role="status" aria-label="Loading dashboard content">
        {/* Header Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-9 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-5 bg-gray-200 rounded w-48"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid md:grid-cols-3 gap-4 mb-8 animate-pulse">
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg w-9 h-9"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg w-9 h-9"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg w-9 h-9"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header Skeleton */}
        <div className="flex items-center justify-between mb-6 animate-pulse">
          <div className="h-7 bg-gray-200 rounded w-40"></div>
          <div className="h-5 bg-gray-200 rounded w-32"></div>
        </div>

        {/* Sources List Skeleton */}
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          ))}
        </div>

        <span className="sr-only">Loading dashboard, please wait...</span>
      </div>
    </div>
  )
}
