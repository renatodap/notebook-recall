import MobileNav from '@/components/MobileNav';

export default function WorkspaceDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNav />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Loading announcement for screen readers */}
        <div className="sr-only" role="status" aria-live="polite">
          Loading workspace details...
        </div>

        {/* Workspace header skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded" />
              <div className="space-y-2">
                <div className="h-7 bg-gray-200 rounded w-64" />
                <div className="h-4 bg-gray-200 rounded w-32" />
              </div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-40" />
          </div>

          {/* Description */}
          <div className="space-y-2 mb-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-11/12" />
          </div>

          {/* Stats */}
          <div className="flex gap-8 animate-pulse">
            <div className="space-y-1">
              <div className="h-3 bg-gray-200 rounded w-16" />
              <div className="h-5 bg-gray-200 rounded w-12" />
            </div>
            <div className="space-y-1">
              <div className="h-3 bg-gray-200 rounded w-16" />
              <div className="h-5 bg-gray-200 rounded w-12" />
            </div>
            <div className="space-y-1">
              <div className="h-3 bg-gray-200 rounded w-16" />
              <div className="h-5 bg-gray-200 rounded w-12" />
            </div>
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="mb-6 flex gap-4 border-b border-gray-200 animate-pulse">
          <div className="h-10 bg-gray-200 rounded-t w-24" />
          <div className="h-10 bg-gray-200 rounded-t w-24" />
          <div className="h-10 bg-gray-200 rounded-t w-32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sources list */}
            <div
              className="bg-white rounded-lg border border-gray-200 p-6"
              aria-label="Loading workspace sources"
            >
              <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse" />

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
          </div>

          {/* Sidebar skeleton */}
          <div className="space-y-6">
            {/* Members card */}
            <div
              className="bg-white rounded-lg border border-gray-200 p-6"
              aria-label="Loading workspace members"
            >
              <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse" />

              <div className="space-y-3">
                {[1, 2, 3, 4].map((member) => (
                  <div key={member} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-gray-200 rounded w-32" />
                      <div className="h-3 bg-gray-200 rounded w-20" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 h-10 bg-gray-200 rounded w-full animate-pulse" />
            </div>

            {/* Activity card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse" />

              <div className="space-y-3">
                {[1, 2, 3].map((activity) => (
                  <div key={activity} className="space-y-2 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-24" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
