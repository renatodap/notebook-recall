import MobileNav from '@/components/MobileNav';

export default function TimelineLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNav />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Loading announcement for screen readers */}
        <div className="sr-only" role="status" aria-live="polite">
          Loading timeline visualization...
        </div>

        {/* Header skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-72 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-full max-w-xl" />
        </div>

        {/* Filters skeleton */}
        <div className="mb-6 flex gap-4 animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-32" />
          <div className="h-10 bg-gray-200 rounded w-32" />
          <div className="h-10 bg-gray-200 rounded w-40" />
        </div>

        {/* Timeline visualization skeleton */}
        <div
          className="bg-white rounded-lg border border-gray-200 p-8"
          aria-label="Loading timeline visualization"
        >
          <div className="space-y-12">
            {/* Timeline entries */}
            {[1, 2, 3, 4, 5].map((entry) => (
              <div key={entry} className="flex gap-8 animate-pulse">
                {/* Year marker */}
                <div className="flex-shrink-0 w-24">
                  <div className="h-8 bg-gray-200 rounded w-20" />
                </div>

                {/* Timeline line */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-4 h-4 bg-gray-200 rounded-full" />
                  <div className="w-0.5 h-32 bg-gray-200" />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3 pb-8">
                  <div className="h-6 bg-gray-200 rounded w-64" />
                  <div className="h-4 bg-gray-200 rounded w-48" />
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-11/12" />
                    <div className="h-3 bg-gray-200 rounded w-10/12" />
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((tag) => (
                      <div
                        key={tag}
                        className="h-6 bg-gray-200 rounded w-20"
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export button skeleton */}
        <div className="mt-6 flex justify-end animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-40" />
        </div>
      </main>
    </div>
  );
}
