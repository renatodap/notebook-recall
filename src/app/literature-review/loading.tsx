import MobileNav from '@/components/MobileNav';

export default function LiteratureReviewLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNav />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Loading announcement for screen readers */}
        <div className="sr-only" role="status" aria-live="polite">
          Loading literature review...
        </div>

        {/* Header skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-96" />
        </div>

        {/* Filters skeleton */}
        <div className="mb-6 flex gap-4 animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-32" />
          <div className="h-10 bg-gray-200 rounded w-32" />
          <div className="h-10 bg-gray-200 rounded w-32" />
          <div className="h-10 bg-gray-200 rounded flex-1" />
        </div>

        {/* Literature review sections skeleton */}
        <div className="space-y-8">
          {[1, 2, 3].map((section) => (
            <div
              key={section}
              className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"
              aria-label="Loading literature review section"
            >
              {/* Section title */}
              <div className="h-6 bg-gray-200 rounded w-48 mb-4" />

              {/* Section content */}
              <div className="space-y-3 mb-4">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-11/12" />
                <div className="h-4 bg-gray-200 rounded w-10/12" />
              </div>

              {/* Source citations */}
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4].map((cite) => (
                  <div
                    key={cite}
                    className="h-6 bg-gray-200 rounded w-24"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Generate button skeleton */}
        <div className="mt-8 flex justify-end animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-48" />
        </div>
      </main>
    </div>
  );
}
