export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Header Skeleton */}
      <nav className="bg-white border-b border-gray-200 shadow-sm" role="status" aria-label="Loading public source">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 animate-pulse">
          <div className="flex justify-between items-center gap-2">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="flex gap-2">
              <div className="h-8 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Skeleton */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Source Card Skeleton */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 sm:p-8">
                <div className="h-6 bg-gray-200 rounded-full w-32 mb-3"></div>
                <div className="h-10 bg-gray-200 rounded w-full mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="flex items-center gap-4">
                  <div className="h-5 bg-gray-200 rounded w-24"></div>
                  <div className="h-5 bg-gray-200 rounded w-32"></div>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                {/* Summary Section */}
                <div>
                  <div className="h-7 bg-gray-200 rounded w-40 mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-full"></div>
                    <div className="h-5 bg-gray-200 rounded w-full"></div>
                    <div className="h-5 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-5 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>

                {/* Key Actions Section */}
                <div>
                  <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-16 bg-gray-100 rounded-lg"></div>
                    <div className="h-16 bg-gray-100 rounded-lg"></div>
                    <div className="h-16 bg-gray-100 rounded-lg"></div>
                  </div>
                </div>

                {/* Topics Section */}
                <div>
                  <div className="h-6 bg-gray-200 rounded w-24 mb-3"></div>
                  <div className="flex flex-wrap gap-2">
                    <div className="h-10 bg-gray-200 rounded-full w-24"></div>
                    <div className="h-10 bg-gray-200 rounded-full w-32"></div>
                    <div className="h-10 bg-gray-200 rounded-full w-28"></div>
                    <div className="h-10 bg-gray-200 rounded-full w-20"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Full Content Card Skeleton */}
            <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 animate-pulse">
              <div className="h-7 bg-gray-200 rounded w-40 mb-4"></div>
              <div className="space-y-3">
                <div className="h-5 bg-gray-200 rounded w-full"></div>
                <div className="h-5 bg-gray-200 rounded w-full"></div>
                <div className="h-5 bg-gray-200 rounded w-5/6"></div>
                <div className="h-5 bg-gray-200 rounded w-full"></div>
                <div className="h-5 bg-gray-200 rounded w-4/5"></div>
              </div>
            </div>
          </div>

          {/* Sidebar CTA Skeleton */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <div className="bg-white rounded-lg shadow-lg border-2 border-indigo-200 p-6 animate-pulse">
                <div className="text-center">
                  <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-7 bg-gray-200 rounded w-48 mx-auto mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto mb-6"></div>
                  <div className="h-11 bg-gray-200 rounded w-full mb-3"></div>
                  <div className="h-11 bg-gray-200 rounded w-full"></div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-5 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-full"></div>
                  <div className="h-5 bg-gray-200 rounded w-full"></div>
                  <div className="h-5 bg-gray-200 rounded w-full"></div>
                  <div className="h-5 bg-gray-200 rounded w-full"></div>
                  <div className="h-5 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <span className="sr-only">Loading public source, please wait...</span>
      </div>
    </div>
  )
}
