import MobileNav from '@/components/MobileNav'

export default function Loading() {
  return (
    <>
      <MobileNav />
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64">
        <div className="max-w-5xl mx-auto px-4 py-8" role="status" aria-label="Loading synthesis report">
          {/* Header Skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-6 bg-gray-200 rounded-full w-32"></div>
              <div className="h-5 bg-gray-200 rounded w-24"></div>
              <div className="h-5 bg-gray-200 rounded w-32"></div>
            </div>
          </div>

          {/* Executive Summary Skeleton */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8 animate-pulse">
            <div className="h-7 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-3">
              <div className="h-5 bg-gray-200 rounded w-full"></div>
              <div className="h-5 bg-gray-200 rounded w-full"></div>
              <div className="h-5 bg-gray-200 rounded w-5/6"></div>
              <div className="h-5 bg-gray-200 rounded w-full"></div>
            </div>
          </div>

          {/* Main Sections Skeleton */}
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg p-8 animate-pulse">
                <div className="h-7 bg-gray-200 rounded w-64 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-full"></div>
                  <div className="h-5 bg-gray-200 rounded w-full"></div>
                  <div className="h-5 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-5 bg-gray-200 rounded w-full"></div>
                  <div className="h-5 bg-gray-200 rounded w-4/5"></div>
                  <div className="h-5 bg-gray-200 rounded w-full"></div>
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                </div>

                {/* Subsection */}
                <div className="mt-6">
                  <div className="h-6 bg-gray-200 rounded w-48 mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sources List Skeleton */}
          <div className="bg-white rounded-lg shadow-lg p-8 mt-8 animate-pulse">
            <div className="h-7 bg-gray-200 rounded w-40 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className="h-5 bg-gray-200 rounded w-8"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <span className="sr-only">Loading synthesis report, please wait...</span>
        </div>
      </div>
    </>
  )
}
