export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <nav className="bg-white border-b border-gray-200 shadow-sm mb-8" role="status" aria-label="Loading research questions">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-48"></div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Skeleton */}
        <div className="text-center mb-12 animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-96 mx-auto mb-3"></div>
          <div className="h-6 bg-gray-200 rounded w-80 mx-auto"></div>
        </div>

        {/* Action Bar Skeleton */}
        <div className="flex items-center justify-between mb-8 animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-64"></div>
          <div className="h-10 bg-gray-200 rounded w-48"></div>
        </div>

        {/* Research Questions List Skeleton */}
        <div className="space-y-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-full mb-3"></div>
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-5/6"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-9 w-9 bg-gray-200 rounded"></div>
                  <div className="h-9 w-9 bg-gray-200 rounded"></div>
                </div>
              </div>

              {/* Linked Sources Skeleton */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
                <div className="flex flex-wrap gap-2">
                  <div className="h-8 bg-gray-200 rounded w-40"></div>
                  <div className="h-8 bg-gray-200 rounded w-36"></div>
                  <div className="h-8 bg-gray-200 rounded w-44"></div>
                </div>
              </div>

              {/* Progress Indicator Skeleton */}
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                  <div className="h-5 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State Alternative Skeleton */}
        <div className="bg-white rounded-lg shadow-md p-12 text-center animate-pulse">
          <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-7 bg-gray-200 rounded w-64 mx-auto mb-3"></div>
          <div className="h-5 bg-gray-200 rounded w-96 mx-auto mb-6"></div>
          <div className="h-11 bg-gray-200 rounded w-56 mx-auto"></div>
        </div>

        <span className="sr-only">Loading research questions, please wait...</span>
      </div>
    </div>
  )
}
