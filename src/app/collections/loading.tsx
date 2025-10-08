import ChatSidebar from '@/components/ChatSidebar'
import MobileSidebar from '@/components/MobileSidebar'

export default function Loading() {
  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--chat-bg-main)' }}>
      <ChatSidebar />
      <MobileSidebar />

      <div className="flex-1 flex flex-col md:ml-64 overflow-y-auto">
        <main className="max-w-7xl mx-auto px-6 py-8 w-full" role="status" aria-label="Loading collections">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-8 animate-pulse">
            <div>
              <div className="h-9 rounded w-48 mb-3" style={{ backgroundColor: 'var(--chat-border)' }}></div>
              <div className="h-5 rounded w-64" style={{ backgroundColor: 'var(--chat-border)' }}></div>
            </div>
            <div className="h-10 rounded w-40" style={{ backgroundColor: 'var(--chat-border)' }}></div>
          </div>

          {/* Collections Grid Skeleton */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-lg p-6 border"
                style={{
                  backgroundColor: 'var(--chat-bg-message-ai)',
                  borderColor: 'var(--chat-border)'
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="h-6 rounded w-3/4 mb-2" style={{ backgroundColor: 'var(--chat-border)' }}></div>
                    <div className="h-4 rounded w-full mb-1" style={{ backgroundColor: 'var(--chat-border)' }}></div>
                    <div className="h-4 rounded w-5/6" style={{ backgroundColor: 'var(--chat-border)' }}></div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="h-5 rounded w-20" style={{ backgroundColor: 'var(--chat-border)' }}></div>
                  <div className="h-6 rounded-full w-16" style={{ backgroundColor: 'var(--chat-border)' }}></div>
                </div>
              </div>
            ))}
          </div>

          <span className="sr-only">Loading collections, please wait...</span>
        </main>
      </div>
    </div>
  )
}
