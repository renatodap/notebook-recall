import MobileNav from '@/components/MobileNav';

export default function WorkspacesLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNav />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Loading announcement for screen readers */}
        <div className="sr-only" role="status" aria-live="polite">
          Loading workspaces...
        </div>

        {/* Header skeleton */}
        <div className="mb-8 flex justify-between items-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-96" />
          </div>
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-48" />
          </div>
        </div>

        {/* Workspaces grid skeleton */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          aria-label="Loading workspaces list"
        >
          {[1, 2, 3, 4, 5, 6].map((workspace) => (
            <div
              key={workspace}
              className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"
            >
              {/* Workspace icon and name */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-40" />
                  <div className="h-4 bg-gray-200 rounded w-24" />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-11/12" />
                <div className="h-3 bg-gray-200 rounded w-10/12" />
              </div>

              {/* Stats */}
              <div className="flex gap-6 mb-4 pt-4 border-t border-gray-200">
                <div className="space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-16" />
                  <div className="h-5 bg-gray-200 rounded w-12" />
                </div>
                <div className="space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-16" />
                  <div className="h-5 bg-gray-200 rounded w-12" />
                </div>
              </div>

              {/* Members avatars */}
              <div className="flex -space-x-2">
                {[1, 2, 3].map((avatar) => (
                  <div
                    key={avatar}
                    className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white"
                  />
                ))}
                <div className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="h-3 bg-gray-300 rounded w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
