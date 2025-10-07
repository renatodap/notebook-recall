import MobileNav from '@/components/MobileNav';

export default function MethodologyLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNav />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Loading announcement for screen readers */}
        <div className="sr-only" role="status" aria-live="polite">
          Loading methodology comparison...
        </div>

        {/* Header skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-80 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-full max-w-2xl" />
        </div>

        {/* Filters skeleton */}
        <div className="mb-6 flex gap-4 animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-40" />
          <div className="h-10 bg-gray-200 rounded w-40" />
          <div className="h-10 bg-gray-200 rounded flex-1" />
        </div>

        {/* Comparison table skeleton */}
        <div
          className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          aria-label="Loading methodology comparison table"
        >
          {/* Table header */}
          <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 border-b border-gray-200 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-32" />
            <div className="h-5 bg-gray-200 rounded w-28" />
            <div className="h-5 bg-gray-200 rounded w-28" />
            <div className="h-5 bg-gray-200 rounded w-28" />
            <div className="h-5 bg-gray-200 rounded w-28" />
          </div>

          {/* Table rows */}
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="grid grid-cols-5 gap-4 p-4 border-b border-gray-200 animate-pulse"
            >
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded w-40" />
                <div className="h-3 bg-gray-200 rounded w-32" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-4 bg-gray-200 rounded w-28" />
            </div>
          ))}
        </div>

        {/* Export button skeleton */}
        <div className="mt-6 flex justify-end animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-40" />
        </div>
      </main>
    </div>
  );
}
