import MobileNav from '@/components/MobileNav'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64">
      <MobileNav />

      <div className="max-w-7xl mx-auto px-4 py-8" role="status" aria-label="Loading synthesis reports">
        {/* Header Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-9 bg-gray-200 rounded w-96 mb-3"></div>
          <div className="h-5 bg-gray-200 rounded w-80"></div>
        </div>

        {/* Reports Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="h-6 bg-gray-200 rounded-full w-28"></div>
                <div className="h-5 bg-gray-200 rounded w-16"></div>
              </div>

              <div className="h-6 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-4/5 mb-3"></div>

              <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-3"></div>

              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-28"></div>
              </div>
            </div>
          ))}
        </div>

        <span className="sr-only">Loading synthesis reports, please wait...</span>
      </div>
    </div>
  )
}
