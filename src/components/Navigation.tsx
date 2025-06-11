import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, Sparkles, Tablet, Settings } from 'lucide-react';

export function Navigation() {
  const location = useLocation()
  const isKiosk = location.pathname.includes('/kiosk') || location.pathname === '/'
  const isAdmin = location.pathname.includes('/admin')

  const navLinkClasses = "group relative flex items-center justify-center px-4 py-2 text-sm font-medium text-white/80 rounded-full transition-all duration-300 ease-in-out hover:text-white"
  const activeLinkClasses = "bg-white/10 shadow-inner-white"

  return (
    <header className="fixed top-0 left-0 right-0 z-50 safe-top">
      <nav className="mx-auto mt-4 max-w-lg rounded-full border border-white/20 bg-black/10 p-2 shadow-lg backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 pl-4">
            <div className="relative">
              <GraduationCap className="h-7 w-7 text-white" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-gold-300 animate-ping" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-gold-400" />
            </div>
            <span className="text-lg font-bold text-white">SCA Hostels</span>
          </Link>

          <div className="flex items-center space-x-2">
            <Link
              to="/kiosk"
              className={`${navLinkClasses} ${isKiosk ? activeLinkClasses : ''}`}
            >
              <Tablet className="mr-2 h-4 w-4" />
              Student Kiosk
            </Link>
            <Link
              to="/admin"
              className={`${navLinkClasses} ${isAdmin ? activeLinkClasses : ''}`}
            >
              <Settings className="mr-2 h-4 w-4" />
              Admin Panel
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
} 