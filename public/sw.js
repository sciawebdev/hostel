const CACHE_NAME = 'hostel-management-v1'
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
]

// Install event - cache essential resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files')
        return cache.addAll(urlsToCache)
      })
      .catch(err => console.log('Service Worker: Cache failed', err))
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache')
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip Supabase API calls (let offline sync handle them)
  if (event.request.url.includes('supabase.co')) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
      .catch(() => {
        // If both cache and network fail, return offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/')
        }
      })
  )
})

// Background sync event for offline data
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-complaints') {
    event.waitUntil(syncOfflineComplaints())
  }
})

// Sync offline complaints when connection is restored
async function syncOfflineComplaints() {
  try {
    // This will be handled by our OfflineSync service
    console.log('Service Worker: Background sync triggered')
    
    // Send message to main thread to trigger sync
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        tag: 'sync-complaints'
      })
    })
  } catch (error) {
    console.error('Service Worker: Background sync failed', error)
  }
}

// Handle push notifications
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body || 'New notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.id || '1'
      },
      actions: [
        {
          action: 'view',
          title: 'View Details',
          icon: '/icons/view.png'
        },
        {
          action: 'close',
          title: 'Dismiss',
          icon: '/icons/close.png'
        }
      ]
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'Hostel Management', options)
    )
  }
})

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close()

  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
}) 