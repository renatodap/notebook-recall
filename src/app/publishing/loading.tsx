import MobileNav from '@/components/MobileNav'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64">
      <MobileNav />

      <div className="container mx-auto px-4 py-8" role="status" aria-label="Loading publishing dashboard">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-8 animate-pulse">
          <div className="h-9 bg-gray-200 rounded w-80"></div>
          <div className="h-5 bg-gray-200 rounded w-32"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 animate-pulse">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="h-5 bg-gray-200 rounded w-28 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-16"></div>
          </div>
        </div>

        {/* Outputs List Skeleton */}
        <div className="bg-white rounded-lg shadow p-6 mb-8 animate-pulse">
          <div className="h-7 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-40"></div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Info Box Skeleton */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-56 mb-3"></div>
          <div className="h-5 bg-gray-200 rounded w-full mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-6 bg-gray-200 rounded w-48"></div>
            ))}
          </div>
        </div>

        <span className="sr-only">Loading publishing dashboard, please wait...</span>
      </div>
    </div>
  )
}
