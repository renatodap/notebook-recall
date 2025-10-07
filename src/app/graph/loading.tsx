import MobileNav from '@/components/MobileNav';

export default function GraphLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNav />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Loading announcement for screen readers */}
        <div className="sr-only" role="status" aria-live="polite">
          Loading knowledge graph...
        </div>

        {/* Header skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-96" />
        </div>

        {/* Controls skeleton */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-4 animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-32" />
            <div className="h-10 bg-gray-200 rounded w-32" />
            <div className="h-10 bg-gray-200 rounded w-32" />
          </div>
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-40" />
          </div>
        </div>

        {/* Graph visualization skeleton with progress indicator */}
        <div
          className="bg-white rounded-lg border border-gray-200 p-8 relative"
          style={{ height: '600px' }}
          aria-label="Loading knowledge graph"
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Loading spinner */}
            <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4" />

            {/* Progress text */}
            <div className="space-y-2 text-center animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-48 mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-64 mx-auto" />
            </div>

            {/* Progress bar */}
            <div className="w-80 h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>

          {/* Mock graph nodes */}
          <div className="absolute inset-0 p-8 opacity-20 animate-pulse">
            <div className="absolute top-20 left-20 w-24 h-24 bg-blue-200 rounded-full" />
            <div className="absolute top-40 right-32 w-20 h-20 bg-purple-200 rounded-full" />
            <div className="absolute bottom-32 left-40 w-16 h-16 bg-green-200 rounded-full" />
            <div className="absolute bottom-20 right-20 w-20 h-20 bg-orange-200 rounded-full" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-red-200 rounded-full" />
          </div>
        </div>

        {/* Legend skeleton */}
        <div className="mt-6 flex gap-8 justify-center animate-pulse">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded-full" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
