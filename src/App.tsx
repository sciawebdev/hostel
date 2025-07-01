import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { queryClient } from './lib/react-query'
import { SimpleComplaintForm } from './pages'
import { Navigation } from './components/Navigation'
import { RoleBasedDashboard } from './components/RoleBasedDashboard'
import { AuthProvider } from './components/AuthProvider'
import { OfflineIndicator } from './components/OfflineIndicator'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          {/* Background decorative elements */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute top-20 left-10 w-32 h-32 bg-gold-400/10 rounded-full blur-xl animate-float"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary-400/10 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          </div>
          
          <div className="min-h-screen relative z-10 flex flex-col">
            <Navigation />
            
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Navigate to="/kiosk" replace />} />
                <Route path="/kiosk" element={<SimpleComplaintForm />} />
                <Route path="/admin" element={<RoleBasedDashboard />} />
              </Routes>
            </main>
          </div>

          {/* Offline sync indicator */}
          <OfflineIndicator />

          {/* Modern Toast notifications */}
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                fontSize: '16px',
                padding: '16px 24px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(234, 179, 8, 0.2)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                color: '#1e293b',
              },
            }}
          />

          {/* React Query DevTools - only in development */}
          <ReactQueryDevtools initialIsOpen={false} />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
