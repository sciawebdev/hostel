import { useAuth } from './AuthProvider'
import { AdminRoleDashboard } from './AdminRoleDashboard'
import { CampusInChargeDashboard } from './CampusInChargeDashboard'
import { FloorInchargeDashboard } from './FloorInchargeDashboard'
import { LoginForm } from './LoginForm'
import { AlertTriangle } from 'lucide-react'

export function RoleBasedDashboard() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  // Route to appropriate dashboard based on user role
  switch (user.user_roles?.name) {
    case 'administrator':
      return <AdminRoleDashboard />
    
    case 'campus_in_charge':
      return <CampusInChargeDashboard />
    
    case 'floor_incharge':
      return <FloorInchargeDashboard />
    
    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              Your account doesn't have the required permissions to access the admin panel.
              Please contact your system administrator.
            </p>
            <p className="text-sm text-gray-500">
              Current role: {user.user_roles?.name || 'Unknown'}
            </p>
          </div>
        </div>
      )
  }
} 