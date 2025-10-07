import MobileNav from '@/components/MobileNav';

export default function ImportLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNav />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Loading announcement for screen readers */}
        <div className="sr-only" role="status" aria-live="polite">
          Loading import references page...
        </div>

        {/* Header skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-80 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-full max-w-2xl" />
        </div>

        {/* Import options skeleton */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
          aria-label="Loading import options"
        >
          {[1, 2, 3, 4].map((option) => (
            <div
              key={option}
              className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"
            >
              {/* Icon */}
              <div className="w-12 h-12 bg-gray-200 rounded mb-4" />

              {/* Title */}
              <div className="h-6 bg-gray-200 rounded w-48 mb-3" />

              {/* Description */}
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-11/12" />
                <div className="h-4 bg-gray-200 rounded w-10/12" />
              </div>

              {/* Supported formats */}
              <div className="flex gap-2 mb-4">
                {[1, 2, 3].map((format) => (
                  <div
                    key={format}
                    className="h-6 bg-gray-200 rounded w-16"
                  />
                ))}
              </div>

              {/* Select button */}
              <div className="h-10 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>

        {/* File upload area skeleton */}
        <div
          className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12"
          aria-label="Loading file upload area"
        >
          <div className="flex flex-col items-center animate-pulse">
            <div className="w-16 h-16 bg-gray-200 rounded-full mb-4" />
            <div className="h-6 bg-gray-200 rounded w-64 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-80 mb-6" />
            <div className="h-10 bg-gray-200 rounded w-40" />
          </div>
        </div>

        {/* Recent imports skeleton */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-40 mb-6 animate-pulse" />

          <div className="space-y-4">
            {[1, 2, 3].map((import_item) => (
              <div
                key={import_item}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg animate-pulse"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-64" />
                    <div className="h-4 bg-gray-200 rounded w-48" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-6 bg-gray-200 rounded w-20" />
                  <div className="h-4 bg-gray-200 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
