// Service Worker for PWA - Recall Notebook
const CACHE_NAME = 'recall-notebook-v1'
const OFFLINE_URL = '/offline.html'

// Files to cache for offline access
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/search',
  '/chat',
  '/tools',
  '/offline.html',
  '/icon-192.png',
  '/icon-512.png',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell')
      return cache.addAll(STATIC_ASSETS)
    }).then(() => {
      return self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip chrome extension requests
  if (request.url.includes('chrome-extension://')) return

  // Network-first strategy for API calls
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful responses
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Return cached response if available
          return caches.match(request)
        })
    )
    return
  }

  // Cache-first strategy for everything else
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version and update in background
        fetch(request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response)
            })
          }
        }).catch(() => {})

        return cachedResponse
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Show offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL)
          }
          return new Response('Offline', { status: 503 })
        })
    })
  )
})

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag)

  if (event.tag === 'sync-sources') {
    event.waitUntil(syncSources())
  }
})

async function syncSources() {
  try {
    // Get pending sync data from IndexedDB
    const db = await openDB()
    const pendingItems = await getPendingSync(db)

    // Sync each item
    for (const item of pendingItems) {
      try {
        await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body
        })

        // Remove from pending after successful sync
        await removePendingSync(db, item.id)
      } catch (error) {
        console.error('[Service Worker] Sync failed for item:', item.id, error)
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync error:', error)
  }
}

// Notification handling
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received')

  const options = {
    body: event.data?.text() || 'New update available',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'recall-notification',
    requireInteraction: false,
  }

  event.waitUntil(
    self.registration.showNotification('Recall Notebook', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked')
  event.notification.close()

  event.waitUntil(
    clients.openWindow('/dashboard')
  )
})

// Helper functions for IndexedDB (basic implementation)
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('recall-offline-db', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('pending-sync')) {
        db.createObjectStore('pending-sync', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

function getPendingSync(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-sync'], 'readonly')
    const store = transaction.objectStore('pending-sync')
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

function removePendingSync(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-sync'], 'readwrite')
    const store = transaction.objectStore('pending-sync')
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

console.log('[Service Worker] Loaded successfully')
