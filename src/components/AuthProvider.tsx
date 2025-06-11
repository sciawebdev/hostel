import { createContext, useContext, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import type { User, AuthContextType } from '../types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

// Demo users with proper structure matching app_users table
const demoUsers: User[] = [
  // Administrator
  {
    id: 'admin-1',
    email: 'admin@hostel.edu',
    name: 'System Administrator',
    contact: '+91-9876543210',
    role_id: 'admin-role',
    specialization: 'System Management',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'admin-role',
      name: 'administrator',
      description: 'Full system access',
      permissions: {
        view_all_complaints: true,
        approve_costs: true,
        resolve_complaints: true,
        view_statistics: true,
        manage_users: true,
        view_analytics: true
      },
      created_at: new Date().toISOString()
    }
  },

  // Campus Coordinators
  {
    id: 'campus-coord-1',
    email: 'coord1@hostel.edu',
    name: 'Ravi Kumar',
    contact: '+91-9876543211',
    role_id: 'campus-ic-role',
    specialization: 'Godavari & Sarayu Hostels Coordinator',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'campus-ic-role',
      name: 'campus_in_charge',
      description: 'Campus coordinator role',
      permissions: {
        view_assigned_complaints: true,
        estimate_costs: true,
        create_cost_estimates: true,
        update_work_progress: true,
        submit_bills: true,
        view_own_statistics: true
      },
      created_at: new Date().toISOString()
    }
  },

  {
    id: 'campus-coord-2',
    email: 'coord2@hostel.edu',
    name: 'Priya Sharma',
    contact: '+91-9876543212',
    role_id: 'campus-ic-role',
    specialization: 'Ganga 1 & Ganga 2 Hostels Coordinator',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'campus-ic-role',
      name: 'campus_in_charge',
      description: 'Campus coordinator role',
      permissions: {
        view_assigned_complaints: true,
        estimate_costs: true,
        create_cost_estimates: true,
        update_work_progress: true,
        submit_bills: true,
        view_own_statistics: true
      },
      created_at: new Date().toISOString()
    }
  },

  {
    id: 'campus-coord-3',
    email: 'coord3@hostel.edu',
    name: 'Amit Patel',
    contact: '+91-9876543213',
    role_id: 'campus-ic-role',
    specialization: 'Krishna & Narmada Hostels Coordinator',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'campus-ic-role',
      name: 'campus_in_charge',
      description: 'Campus coordinator role',
      permissions: {
        view_assigned_complaints: true,
        estimate_costs: true,
        create_cost_estimates: true,
        update_work_progress: true,
        submit_bills: true,
        view_own_statistics: true
      },
      created_at: new Date().toISOString()
    }
  },

  {
    id: 'campus-coord-4',
    email: 'coord4@hostel.edu',
    name: 'Sunita Rao',
    contact: '+91-9876543214',
    role_id: 'campus-ic-role',
    specialization: 'Bhramaputra 1 & Bhramaputra 2 Hostels Coordinator',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'campus-ic-role',
      name: 'campus_in_charge',
      description: 'Campus coordinator role',
      permissions: {
        view_assigned_complaints: true,
        estimate_costs: true,
        create_cost_estimates: true,
        update_work_progress: true,
        submit_bills: true,
        view_own_statistics: true
      },
      created_at: new Date().toISOString()
    }
  },

  {
    id: 'campus-coord-5',
    email: 'coord5@hostel.edu',
    name: 'Vikram Singh',
    contact: '+91-9876543215',
    role_id: 'campus-ic-role',
    specialization: 'Saraswathi Hostel Coordinator',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'campus-ic-role',
      name: 'campus_in_charge',
      description: 'Campus coordinator role',
      permissions: {
        view_assigned_complaints: true,
        estimate_costs: true,
        create_cost_estimates: true,
        update_work_progress: true,
        submit_bills: true,
        view_own_statistics: true
      },
      created_at: new Date().toISOString()
    }
  },

  {
    id: 'campus-coord-6',
    email: 'coord6@hostel.edu',
    name: 'Meera Gupta',
    contact: '+91-9876543216',
    role_id: 'campus-ic-role',
    specialization: 'Civils Lt Girls Hostel Coordinator',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'campus-ic-role',
      name: 'campus_in_charge',
      description: 'Campus coordinator role',
      permissions: {
        view_assigned_complaints: true,
        estimate_costs: true,
        create_cost_estimates: true,
        update_work_progress: true,
        submit_bills: true,
        view_own_statistics: true
      },
      created_at: new Date().toISOString()
    }
  },

  {
    id: 'campus-coord-7',
    email: 'coord7@hostel.edu',
    name: 'Arjun Nair',
    contact: '+91-9876543217',
    role_id: 'campus-ic-role',
    specialization: 'Benz Circle Hostel Coordinator',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'campus-ic-role',
      name: 'campus_in_charge',
      description: 'Campus coordinator role',
      permissions: {
        view_assigned_complaints: true,
        estimate_costs: true,
        create_cost_estimates: true,
        update_work_progress: true,
        submit_bills: true,
        view_own_statistics: true
      },
      created_at: new Date().toISOString()
    }
  },

  // Wardens
  {
    id: 'warden-godavari',
    email: 'warden1@hostel.edu',
    name: 'Dr. Priya Sharma',
    contact: '+91-9876543221',
    role_id: 'warden-role',
    specialization: 'Godavari Hostel Warden',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'warden-role',
      name: 'hostel_warden',
      description: 'Hostel warden role',
      permissions: {
        authenticate_complaints: true,
        verify_complaints: true,
        verify_work_completion: true,
        view_hostel_complaints: true,
        assign_complaints: true
      },
      created_at: new Date().toISOString()
    }
  },

  {
    id: 'warden-sarayu',
    email: 'warden2@hostel.edu',
    name: 'Prof. Rajesh Kumar',
    contact: '+91-9876543222',
    role_id: 'warden-role',
    specialization: 'Sarayu Hostel Warden',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'warden-role',
      name: 'hostel_warden',
      description: 'Hostel warden role',
      permissions: {
        authenticate_complaints: true,
        verify_complaints: true,
        verify_work_completion: true,
        view_hostel_complaints: true,
        assign_complaints: true
      },
      created_at: new Date().toISOString()
    }
  },

  {
    id: 'warden-ganga1',
    email: 'warden3@hostel.edu',
    name: 'Dr. Meera Patel',
    contact: '+91-9876543223',
    role_id: 'warden-role',
    specialization: 'Ganga 1 Hostel Warden',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'warden-role',
      name: 'hostel_warden',
      description: 'Hostel warden role',
      permissions: {
        authenticate_complaints: true,
        verify_complaints: true,
        verify_work_completion: true,
        view_hostel_complaints: true,
        assign_complaints: true
      },
      created_at: new Date().toISOString()
    }
  },

  {
    id: 'warden-ganga2',
    email: 'warden4@hostel.edu',
    name: 'Prof. Vikram Singh',
    contact: '+91-9876543224',
    role_id: 'warden-role',
    specialization: 'Ganga 2 Hostel Warden',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'warden-role',
      name: 'hostel_warden',
      description: 'Hostel warden role',
      permissions: {
        authenticate_complaints: true,
        verify_complaints: true,
        verify_work_completion: true,
        view_hostel_complaints: true,
        assign_complaints: true
      },
      created_at: new Date().toISOString()
    }
  },

  {
    id: 'warden-krishna',
    email: 'warden5@hostel.edu',
    name: 'Dr. Sunita Rao',
    contact: '+91-9876543225',
    role_id: 'warden-role',
    specialization: 'Krishna Hostel Warden',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'warden-role',
      name: 'hostel_warden',
      description: 'Hostel warden role',
      permissions: {
        authenticate_complaints: true,
        verify_complaints: true,
        verify_work_completion: true,
        view_hostel_complaints: true,
        assign_complaints: true
      },
      created_at: new Date().toISOString()
    }
  },

  {
    id: 'warden-brahmaputra1',
    email: 'warden6@hostel.edu',
    name: 'Prof. Amit Joshi',
    contact: '+91-9876543226',
    role_id: 'warden-role',
    specialization: 'Bhramaputra 1 Hostel Warden',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'warden-role',
      name: 'hostel_warden',
      description: 'Hostel warden role',
      permissions: {
        authenticate_complaints: true,
        verify_complaints: true,
        verify_work_completion: true,
        view_hostel_complaints: true,
        assign_complaints: true
      },
      created_at: new Date().toISOString()
    }
  },

  {
    id: 'warden-brahmaputra2',
    email: 'warden7@hostel.edu',
    name: 'Dr. Kavita Nair',
    contact: '+91-9876543227',
    role_id: 'warden-role',
    specialization: 'Bhramaputra 2 Hostel Warden',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'warden-role',
      name: 'hostel_warden',
      description: 'Hostel warden role',
      permissions: {
        authenticate_complaints: true,
        verify_complaints: true,
        verify_work_completion: true,
        view_hostel_complaints: true,
        assign_complaints: true
      },
      created_at: new Date().toISOString()
    }
  },

  {
    id: 'warden-narmada',
    email: 'warden8@hostel.edu',
    name: 'Prof. Arjun Gupta',
    contact: '+91-9876543228',
    role_id: 'warden-role',
    specialization: 'Narmada Hostel Warden',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'warden-role',
      name: 'hostel_warden',
      description: 'Hostel warden role',
      permissions: {
        authenticate_complaints: true,
        verify_complaints: true,
        verify_work_completion: true,
        view_hostel_complaints: true,
        assign_complaints: true
      },
      created_at: new Date().toISOString()
    }
  },

  {
    id: 'warden-saraswathi',
    email: 'warden9@hostel.edu',
    name: 'Dr. Lakshmi Iyer',
    contact: '+91-9876543229',
    role_id: 'warden-role',
    specialization: 'Saraswathi Hostel Warden',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'warden-role',
      name: 'hostel_warden',
      description: 'Hostel warden role',
      permissions: {
        authenticate_complaints: true,
        verify_complaints: true,
        verify_work_completion: true,
        view_hostel_complaints: true,
        assign_complaints: true
      },
      created_at: new Date().toISOString()
    }
  },

  {
    id: 'warden-civils-girls',
    email: 'warden10@hostel.edu',
    name: 'Prof. Deepa Menon',
    contact: '+91-9876543230',
    role_id: 'warden-role',
    specialization: 'Civils Lt Girls Hostel Warden',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'warden-role',
      name: 'hostel_warden',
      description: 'Hostel warden role',
      permissions: {
        authenticate_complaints: true,
        verify_complaints: true,
        verify_work_completion: true,
        view_hostel_complaints: true,
        assign_complaints: true
      },
      created_at: new Date().toISOString()
    }
  },

  {
    id: 'warden-benz-circle',
    email: 'warden11@hostel.edu',
    name: 'Dr. Ravi Chandra',
    contact: '+91-9876543231',
    role_id: 'warden-role',
    specialization: 'Benz Circle Hostel Warden',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'warden-role',
      name: 'hostel_warden',
      description: 'Hostel warden role',
      permissions: {
        authenticate_complaints: true,
        verify_complaints: true,
        verify_work_completion: true,
        view_hostel_complaints: true,
        assign_complaints: true
      },
      created_at: new Date().toISOString()
    }
  }
]

// Helper functions for accessing demo users
export const getCampusInChargeUsers = (): User[] => {
  return demoUsers.filter(user => user.role_id === 'campus-ic-role')
}

export const getHostelWardens = (hostelId?: string): User[] => {
  let wardens = demoUsers.filter(user => user.role_id === 'warden-role')
  if (hostelId) {
    wardens = wardens.filter(warden => warden.hostel_id === hostelId || warden.hostel_id === null)
  }
  return wardens
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      // For demo purposes, use the demo users
      const demoUser = demoUsers.find(u => u.email === email)
      
      // Simplified demo authentication - any demo user with correct password
      if (demoUser && (
        (email === 'admin@hostel.edu' && password === 'admin123') ||
        (email.includes('@hostel.edu') && password === 'demo123')
      )) {
        setUser(demoUser)
        toast.success(`Welcome, ${demoUser.name}!`)
        return true
      }
      
      // If not a demo user, try real authentication (for when schema is set up)
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .eq('is_active', true)
          .single()

        if (error) throw error

        if (data) {
          // For now, assign a default role based on email pattern
          let role = 'administrator'
          if (email.includes('campus')) role = 'campus_in_charge'
          if (email.includes('warden')) role = 'hostel_warden'
          
          const userWithRole: User = {
            ...data,
            role_id: role,
            user_roles: {
              id: role,
              name: role,
              description: `${role} role`,
              permissions: role === 'administrator' ? {
                view_all_complaints: true,
                approve_costs: true,
                assign_complaints: true,
                resolve_complaints: true
              } : {}
            }
          }
          
          setUser(userWithRole)
          toast.success(`Welcome, ${data.name}!`)
          return true
        }
      } catch (dbError) {
        console.log('Database not ready, using demo mode')
      }
      
      toast.error('Invalid credentials')
      return false
    } catch (error: any) {
      toast.error('Login failed', {
        description: error.message
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    toast.success('Logged out successfully')
  }

  const hasPermission = (permission: string): boolean => {
    if (!user?.user_roles?.permissions) return false
    return user.user_roles.permissions[permission] === true
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    hasPermission,
    isLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 