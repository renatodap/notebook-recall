'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-8xl mb-6">📡</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          You&apos;re Offline
        </h1>
        <p className="text-gray-600 mb-8">
          It looks like you&apos;ve lost your internet connection. Don&apos;t worry, your cached sources are still available.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/dashboard"
            className="block w-full px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            View Cached Sources
          </a>
        </div>
        <p className="mt-8 text-sm text-gray-500">
          We&apos;ll automatically reconnect when you&apos;re back online
        </p>
      </div>
    </div>
  )
}
