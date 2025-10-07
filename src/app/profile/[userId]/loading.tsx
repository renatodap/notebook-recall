import MobileNav from '@/components/MobileNav';

export default function PublicProfileLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNav />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Loading announcement for screen readers */}
        <div className="sr-only" role="status" aria-live="polite">
          Loading user profile...
        </div>

        {/* Profile header skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <div className="flex items-start gap-6 mb-6 animate-pulse">
            {/* Profile picture */}
            <div className="w-24 h-24 bg-gray-200 rounded-full flex-shrink-0" />

            {/* User info */}
            <div className="flex-1 space-y-3">
              <div className="h-8 bg-gray-200 rounded w-48" />
              <div className="h-5 bg-gray-200 rounded w-64" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>

            {/* Follow button */}
            <div className="h-10 bg-gray-200 rounded w-32" />
          </div>

          {/* Bio */}
          <div className="space-y-2 mb-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-11/12" />
            <div className="h-4 bg-gray-200 rounded w-10/12" />
          </div>

          {/* Research interests */}
          <div className="animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-40 mb-3" />
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map((tag) => (
                <div
                  key={tag}
                  className="h-7 bg-gray-200 rounded w-24"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Stats grid skeleton */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
          aria-label="Loading profile statistics"
        >
          {[1, 2, 3, 4].map((stat) => (
            <div
              key={stat}
              className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>

        {/* Public sources skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6 animate-pulse" />

          <div className="space-y-4">
            {[1, 2, 3, 4].map((source) => (
              <div
                key={source}
                className="border border-gray-200 rounded-lg p-4 animate-pulse"
              >
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="space-y-2 mb-3">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-11/12" />
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
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
