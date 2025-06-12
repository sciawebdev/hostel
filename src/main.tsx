import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { toast } from 'sonner'
// Vite PWA register helper
import { registerSW } from 'virtual:pwa-register'

// Register the service worker for PWA capabilities
registerSW({
  immediate: true,
  onNeedRefresh() {
    toast.info('A new version is available', {
      action: {
        label: 'Update',
        onClick: () => {
          window.location.reload()
        },
      },
    })
  },
  onOfflineReady() {
    toast.success('App ready to work offline')
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
