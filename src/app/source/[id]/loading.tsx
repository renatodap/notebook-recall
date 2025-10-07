export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 mb-8" role="status" aria-label="Loading source details">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-48"></div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 animate-pulse">
        {/* Title Skeleton */}
        <div className="mb-6">
          <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-6 bg-gray-200 rounded-full w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          <div className="h-10 bg-gray-200 rounded-t w-24"></div>
          <div className="h-10 bg-gray-200 rounded-t w-24"></div>
          <div className="h-10 bg-gray-200 rounded-t w-24"></div>
        </div>

        {/* Content Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-full"></div>
            <div className="h-6 bg-gray-200 rounded w-full"></div>
            <div className="h-6 bg-gray-200 rounded w-5/6"></div>
            <div className="h-6 bg-gray-200 rounded w-full"></div>
            <div className="h-6 bg-gray-200 rounded w-4/5"></div>
            <div className="h-6 bg-gray-200 rounded w-full"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </div>

          {/* Key Actions Skeleton */}
          <div className="mt-8">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              <div className="h-16 bg-gray-100 rounded-lg"></div>
              <div className="h-16 bg-gray-100 rounded-lg"></div>
              <div className="h-16 bg-gray-100 rounded-lg"></div>
            </div>
          </div>

          {/* Topics Skeleton */}
          <div className="mt-8">
            <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="flex flex-wrap gap-2">
              <div className="h-8 bg-gray-200 rounded-full w-20"></div>
              <div className="h-8 bg-gray-200 rounded-full w-24"></div>
              <div className="h-8 bg-gray-200 rounded-full w-28"></div>
              <div className="h-8 bg-gray-200 rounded-full w-20"></div>
            </div>
          </div>
        </div>

        <span className="sr-only">Loading source details, please wait...</span>
      </div>
    </div>
  )
}
