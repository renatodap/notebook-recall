import MobileNav from '@/components/MobileNav';

export default function DiscoverLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNav />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Loading announcement for screen readers */}
        <div className="sr-only" role="status" aria-live="polite">
          Loading researchers...
        </div>

        {/* Header skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-96" />
        </div>

        {/* Search and filters skeleton */}
        <div className="mb-6 space-y-4">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded w-full" />
          </div>
          <div className="flex gap-4 animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-32" />
            <div className="h-10 bg-gray-200 rounded w-32" />
            <div className="h-10 bg-gray-200 rounded w-32" />
          </div>
        </div>

        {/* Researchers grid skeleton */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          aria-label="Loading researchers grid"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((card) => (
            <div
              key={card}
              className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"
            >
              {/* Profile picture */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-32" />
                  <div className="h-4 bg-gray-200 rounded w-24" />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-11/12" />
                <div className="h-3 bg-gray-200 rounded w-10/12" />
              </div>

              {/* Research interests tags */}
              <div className="flex gap-2 flex-wrap mb-4">
                {[1, 2, 3].map((tag) => (
                  <div
                    key={tag}
                    className="h-6 bg-gray-200 rounded w-20"
                  />
                ))}
              </div>

              {/* Stats */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
            </div>
          ))}
        </div>

        {/* Load more button skeleton */}
        <div className="mt-8 flex justify-center animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-32" />
        </div>
      </main>
    </div>
  );
}
