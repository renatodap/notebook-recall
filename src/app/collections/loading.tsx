import MobileNav from '@/components/MobileNav'

export default function Loading() {
  return (
    <>
      <MobileNav />
      <div className="min-h-screen bg-neutral-50 md:ml-64">
        <main className="max-w-7xl mx-auto px-6 py-8" role="status" aria-label="Loading collections">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-8 animate-pulse">
            <div>
              <div className="h-9 bg-gray-200 rounded w-48 mb-3"></div>
              <div className="h-5 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-40"></div>
          </div>

          {/* Collections Grid Skeleton */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg p-6 border border-neutral-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="h-5 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                </div>
              </div>
            ))}
          </div>

          <span className="sr-only">Loading collections, please wait...</span>
        </main>
      </div>
    </>
  )
}
