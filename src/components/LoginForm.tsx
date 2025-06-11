import { useState } from 'react'
import { LogIn, User, Mail, AlertCircle } from 'lucide-react'
import { useAuth } from './AuthProvider'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const success = await login(email, password)
      if (!success) {
        setError('Invalid credentials')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Demo accounts for easy testing
  const demoAccounts = [
    { email: 'admin@hostel.edu', password: 'admin123', role: 'Administrator', description: 'Full system access' },
    { email: 'coord1@hostel.edu', password: 'demo123', role: 'Campus Coordinator', description: 'Godavari & Sarayu Hostels' },
    { email: 'coord2@hostel.edu', password: 'demo123', role: 'Campus Coordinator', description: 'Ganga 1 & Ganga 2 Hostels' },
    { email: 'coord3@hostel.edu', password: 'demo123', role: 'Campus Coordinator', description: 'Krishna & Narmada Hostels' },
    { email: 'coord4@hostel.edu', password: 'demo123', role: 'Campus Coordinator', description: 'Bhramaputra 1 & Bhramaputra 2 Hostels' },
    { email: 'coord5@hostel.edu', password: 'demo123', role: 'Campus Coordinator', description: 'Saraswathi Hostel' },
    { email: 'coord6@hostel.edu', password: 'demo123', role: 'Campus Coordinator', description: 'Civils Lt Girls Hostel' },
    { email: 'coord7@hostel.edu', password: 'demo123', role: 'Campus Coordinator', description: 'Benz Circle Hostel' },
    { email: 'warden1@hostel.edu', password: 'demo123', role: 'Hostel Warden', description: 'Godavari Hostel' },
    { email: 'warden2@hostel.edu', password: 'demo123', role: 'Hostel Warden', description: 'Sarayu Hostel' },
    { email: 'warden3@hostel.edu', password: 'demo123', role: 'Hostel Warden', description: 'Ganga 1 Hostel' },
    { email: 'warden4@hostel.edu', password: 'demo123', role: 'Hostel Warden', description: 'Ganga 2 Hostel' },
    { email: 'warden5@hostel.edu', password: 'demo123', role: 'Hostel Warden', description: 'Krishna Hostel' },
    { email: 'warden6@hostel.edu', password: 'demo123', role: 'Hostel Warden', description: 'Bhramaputra 1 Hostel' },
    { email: 'warden7@hostel.edu', password: 'demo123', role: 'Hostel Warden', description: 'Bhramaputra 2 Hostel' },
    { email: 'warden8@hostel.edu', password: 'demo123', role: 'Hostel Warden', description: 'Narmada Hostel' },
    { email: 'warden9@hostel.edu', password: 'demo123', role: 'Hostel Warden', description: 'Saraswathi Hostel' },
    { email: 'warden10@hostel.edu', password: 'demo123', role: 'Hostel Warden', description: 'Civils Lt Girls Hostel' },
    { email: 'warden11@hostel.edu', password: 'demo123', role: 'Hostel Warden', description: 'Benz Circle Hostel' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <LogIn className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Hostel Management System
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-md" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="mt-1 relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <User className="h-4 w-4 mr-2" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Demo Accounts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Demo Accounts</h3>
          <div className="space-y-3">
            {demoAccounts.map((account, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{account.email}</p>
                  <p className="text-xs text-gray-500">{account.role} - {account.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(account.email)
                    setPassword(account.password)
                  }}
                  className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200"
                >
                  Use
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Click "Use" to fill the email and password fields, then click "Sign In"
          </p>
        </div>
      </div>
    </div>
  )
} 