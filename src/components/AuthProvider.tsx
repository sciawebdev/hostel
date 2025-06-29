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
    email: 'admin@saratchandra.co.in',
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
    email: 'coord1@saratchandra.co.in',
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
    email: 'coord2@saratchandra.co.in',
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
    email: 'coord3@saratchandra.co.in',
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
    email: 'coord4@saratchandra.co.in',
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
    email: 'coord5@saratchandra.co.in',
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
    email: 'coord6@saratchandra.co.in',
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
    email: 'coord7@saratchandra.co.in',
    name: 'Arjun Nair',
    contact: '+91-9876543217',
    role_id: 'campus-ic-role',
    specialization: 'Campus Coordinator',
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

  // Floor Incharges (formerly Wardens)
  {
    id: 'floor-incharge-godavari',
    email: 'floor-incharge-godavari@saratchandra.co.in',
    name: 'Floor Incharge - Godavari',
    contact: '+91-9876543220',
    role_id: 'floor-incharge-role',
    hostel_id: 'hostel-godavari',
    specialization: 'Godavari Hostel Floor Incharge',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'floor-incharge-role',
      name: 'floor_incharge',
      description: 'Floor incharge role',
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
    id: 'floor-incharge-sarayu',
    email: 'floor-incharge-sarayu@saratchandra.co.in',
    name: 'Floor Incharge - Sarayu',
    contact: '+91-9876543221',
    role_id: 'floor-incharge-role',
    hostel_id: 'hostel-sarayu',
    specialization: 'Sarayu Hostel Floor Incharge',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'floor-incharge-role',
      name: 'floor_incharge',
      description: 'Floor incharge role',
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
    id: 'floor-incharge-ganga1',
    email: 'floor-incharge-ganga1@saratchandra.co.in',
    name: 'Floor Incharge - Ganga 1',
    contact: '+91-9876543222',
    role_id: 'floor-incharge-role',
    hostel_id: 'hostel-ganga1',
    specialization: 'Ganga 1 Hostel Floor Incharge',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'floor-incharge-role',
      name: 'floor_incharge',
      description: 'Floor incharge role',
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
    id: 'floor-incharge-ganga2',
    email: 'floor-incharge-ganga2@saratchandra.co.in',
    name: 'Floor Incharge - Ganga 2',
    contact: '+91-9876543223',
    role_id: 'floor-incharge-role',
    hostel_id: 'hostel-ganga2',
    specialization: 'Ganga 2 Hostel Floor Incharge',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'floor-incharge-role',
      name: 'floor_incharge',
      description: 'Floor incharge role',
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
    id: 'floor-incharge-krishna',
    email: 'floor-incharge-krishna@saratchandra.co.in',
    name: 'Floor Incharge - Krishna',
    contact: '+91-9876543224',
    role_id: 'floor-incharge-role',
    hostel_id: 'hostel-krishna',
    specialization: 'Krishna Hostel Floor Incharge',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'floor-incharge-role',
      name: 'floor_incharge',
      description: 'Floor incharge role',
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
    id: 'floor-incharge-brahmaputra1',
    email: 'floor-incharge-brahmaputra1@saratchandra.co.in',
    name: 'Floor Incharge - Brahmaputra 1',
    contact: '+91-9876543225',
    role_id: 'floor-incharge-role',
    hostel_id: 'hostel-bhramaputra1',
    specialization: 'Brahmaputra 1 Hostel Floor Incharge',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'floor-incharge-role',
      name: 'floor_incharge',
      description: 'Floor incharge role',
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
    id: 'floor-incharge-brahmaputra2',
    email: 'floor-incharge-brahmaputra2@saratchandra.co.in',
    name: 'Floor Incharge - Brahmaputra 2',
    contact: '+91-9876543226',
    role_id: 'floor-incharge-role',
    hostel_id: 'hostel-bhramaputra2',
    specialization: 'Brahmaputra 2 Hostel Floor Incharge',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'floor-incharge-role',
      name: 'floor_incharge',
      description: 'Floor incharge role',
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
    id: 'floor-incharge-narmada',
    email: 'floor-incharge-narmada@saratchandra.co.in',
    name: 'Floor Incharge - Narmada',
    contact: '+91-9876543227',
    role_id: 'floor-incharge-role',
    hostel_id: 'hostel-narmada',
    specialization: 'Narmada Hostel Floor Incharge',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'floor-incharge-role',
      name: 'floor_incharge',
      description: 'Floor incharge role',
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
    id: 'floor-incharge-saraswathi',
    email: 'floor-incharge-saraswathi@saratchandra.co.in',
    name: 'Floor Incharge - Saraswathi',
    contact: '+91-9876543228',
    role_id: 'floor-incharge-role',
    hostel_id: 'hostel-saraswathi',
    specialization: 'Saraswathi Hostel Floor Incharge',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'floor-incharge-role',
      name: 'floor_incharge',
      description: 'Floor incharge role',
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
    id: 'floor-incharge-civils-girls',
    email: 'floor-incharge-civils-girls@saratchandra.co.in',
    name: 'Floor Incharge - Civils Lt Girls',
    contact: '+91-9876543230',
    role_id: 'floor-incharge-role',
    hostel_id: 'hostel-civils-lt-girls',
    specialization: 'Civils Lt Girls Hostel Floor Incharge',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'floor-incharge-role',
      name: 'floor_incharge',
      description: 'Floor incharge role',
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
    id: 'floor-incharge-benz-circle',
    email: 'floor-incharge-benz-circle@saratchandra.co.in',
    name: 'Floor Incharge - Benz Circle',
    contact: '+91-9876543231',
    role_id: 'floor-incharge-role',
    hostel_id: 'hostel-benz-circle',
    specialization: 'Benz Circle Hostel Floor Incharge',
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_roles: {
      id: 'floor-incharge-role',
      name: 'floor_incharge',
      description: 'Floor incharge role',
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

export const getFloorIncharges = (hostelId?: string): User[] => {
  let floorIncharges = demoUsers.filter(user => user.role_id === 'floor-incharge-role')
  if (hostelId) {
    floorIncharges = floorIncharges.filter(incharge => incharge.hostel_id === hostelId || incharge.hostel_id === null)
  }
  return floorIncharges
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      // Use Supabase Auth for authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        // If Supabase Auth fails, fall back to temporary demo authentication
        console.log('Supabase Auth not ready, using temporary demo mode')
        
        // Temporary passwords for demo/development
        const tempPasswords: Record<string, string> = {
          'admin@saratchandra.co.in': 'SecureAdmin2024!',
          // All other users use the same temporary password
          'coord1@saratchandra.co.in': 'TempPass2024!',
          'coord2@saratchandra.co.in': 'TempPass2024!',
          'coord3@saratchandra.co.in': 'TempPass2024!',
          'coord4@saratchandra.co.in': 'TempPass2024!',
          'coord5@saratchandra.co.in': 'TempPass2024!',
          'coord6@saratchandra.co.in': 'TempPass2024!',
          'coord7@saratchandra.co.in': 'TempPass2024!',
          'floor-incharge-godavari@saratchandra.co.in': 'TempPass2024!',
          'floor-incharge-sarayu@saratchandra.co.in': 'TempPass2024!',
          'floor-incharge-ganga1@saratchandra.co.in': 'TempPass2024!',
          'floor-incharge-ganga2@saratchandra.co.in': 'TempPass2024!',
          'floor-incharge-krishna@saratchandra.co.in': 'TempPass2024!',
          'floor-incharge-brahmaputra1@saratchandra.co.in': 'TempPass2024!',
          'floor-incharge-brahmaputra2@saratchandra.co.in': 'TempPass2024!',
          'floor-incharge-narmada@saratchandra.co.in': 'TempPass2024!',
          'floor-incharge-saraswathi@saratchandra.co.in': 'TempPass2024!',
          'floor-incharge-civils-girls@saratchandra.co.in': 'TempPass2024!',
          'floor-incharge-benz-circle@saratchandra.co.in': 'TempPass2024!'
        }

        if (tempPasswords[email] && tempPasswords[email] === password) {
          const demoUser = demoUsers.find(u => u.email === email)
          if (demoUser) {
            setUser(demoUser)
            toast.success(`Welcome, ${demoUser.name}!`)
            return true
          }
        }
        
        toast.error('Invalid credentials')
        return false
      }

      // If Supabase Auth succeeds, get user data from app_users table
      if (authData.user) {
        const { data: userData, error: userError } = await supabase
          .from('app_users')
          .select(`
            *,
            user_roles (
              id,
              name,
              description,
              permissions
            )
          `)
          .eq('email', email)
          .eq('is_active', true)
          .single()

        if (userError || !userData) {
          await supabase.auth.signOut()
          toast.error('User account not found or inactive')
          return false
        }

        // Update auth_user_id if not set
        if (!userData.auth_user_id) {
          await supabase
            .from('app_users')
            .update({ 
              auth_user_id: authData.user.id,
              last_login: new Date().toISOString()
            })
            .eq('id', userData.id)
        }

        setUser(userData as User)
        toast.success(`Welcome, ${userData.name}!`)
        return true
      }
      
      toast.error('Authentication failed')
      return false
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error('Login failed', {
        description: error.message
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    console.log('Logout function called')
    try {
      // Sign out from Supabase Auth
      supabase.auth.signOut()
      setUser(null)
      toast.success('Logged out successfully')
      console.log('Logout successful')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout failed')
    }
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