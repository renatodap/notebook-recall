import ChatSidebar from '@/components/ChatSidebar'

export default function Loading() {
  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--chat-bg-main)' }}>
      <ChatSidebar />

      <div className="flex-1 flex flex-col md:ml-64 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 md:py-12 w-full" role="status" aria-label="Loading dashboard content">
        {/* Header Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-9 rounded w-64 mb-2" style={{ backgroundColor: 'var(--chat-border)' }}></div>
          <div className="h-5 rounded w-48" style={{ backgroundColor: 'var(--chat-border)' }}></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid md:grid-cols-3 gap-4 mb-8 animate-pulse">
          <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--chat-bg-message-ai)', borderColor: 'var(--chat-border)' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg w-9 h-9" style={{ backgroundColor: 'var(--chat-border)' }}></div>
              <div className="flex-1">
                <div className="h-4 rounded w-24 mb-2" style={{ backgroundColor: 'var(--chat-border)' }}></div>
                <div className="h-8 rounded w-16" style={{ backgroundColor: 'var(--chat-border)' }}></div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--chat-bg-message-ai)', borderColor: 'var(--chat-border)' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg w-9 h-9" style={{ backgroundColor: 'var(--chat-border)' }}></div>
              <div className="flex-1">
                <div className="h-4 rounded w-24 mb-2" style={{ backgroundColor: 'var(--chat-border)' }}></div>
                <div className="h-8 rounded w-16" style={{ backgroundColor: 'var(--chat-border)' }}></div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-6" style={{ backgroundColor: 'var(--chat-bg-message-ai)', borderColor: 'var(--chat-border)' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg w-9 h-9" style={{ backgroundColor: 'var(--chat-border)' }}></div>
              <div className="flex-1">
                <div className="h-4 rounded w-24 mb-2" style={{ backgroundColor: 'var(--chat-border)' }}></div>
                <div className="h-8 rounded w-16" style={{ backgroundColor: 'var(--chat-border)' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header Skeleton */}
        <div className="flex items-center justify-between mb-6 animate-pulse">
          <div className="h-7 rounded w-40" style={{ backgroundColor: 'var(--chat-border)' }}></div>
          <div className="h-5 rounded w-32" style={{ backgroundColor: 'var(--chat-border)' }}></div>
        </div>

        {/* Sources List Skeleton */}
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border p-6" style={{ backgroundColor: 'var(--chat-bg-message-ai)', borderColor: 'var(--chat-border)' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="h-6 rounded w-3/4 mb-3" style={{ backgroundColor: 'var(--chat-border)' }}></div>
                  <div className="h-4 rounded w-full mb-2" style={{ backgroundColor: 'var(--chat-border)' }}></div>
                  <div className="h-4 rounded w-5/6" style={{ backgroundColor: 'var(--chat-border)' }}></div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-6 rounded-full w-20" style={{ backgroundColor: 'var(--chat-border)' }}></div>
                <div className="h-4 rounded w-32" style={{ backgroundColor: 'var(--chat-border)' }}></div>
              </div>
            </div>
          ))}
        </div>

        <span className="sr-only">Loading dashboard, please wait...</span>
        </div>
      </div>
    </div>
  )
}
