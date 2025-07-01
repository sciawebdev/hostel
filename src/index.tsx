// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
        
        // Listen for background sync messages
        navigator.serviceWorker.addEventListener('message', event => {
          if (event.data.type === 'BACKGROUND_SYNC') {
            // Trigger sync via our offline sync service
            import('./lib/offlineSync').then(({ offlineSync }) => {
              offlineSync.forcSync()
            })
          }
        })
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
} 