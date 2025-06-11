// Type definitions for role-based access control system

export type UserRole = {
  id: string
  name: 'administrator' | 'campus_in_charge' | 'hostel_warden'
  description: string
  permissions: {
    view_all_complaints?: boolean
    approve_costs?: boolean
    resolve_complaints?: boolean
    view_statistics?: boolean
    manage_users?: boolean
    view_assigned_complaints?: boolean
    estimate_costs?: boolean
    create_cost_estimates?: boolean
    update_work_progress?: boolean
    submit_bills?: boolean
    view_own_statistics?: boolean
    authenticate_complaints?: boolean
    verify_complaints?: boolean
    verify_work_completion?: boolean
    view_hostel_complaints?: boolean
    assign_complaints?: boolean
    view_analytics?: boolean
    [key: string]: boolean | undefined
  }
  created_at: string
}

export type User = {
  id: string
  email: string
  name: string
  contact: string | null
  role_id: string
  hostel_id?: string | null
  specialization?: string | null
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
  // Joined relations
  user_roles?: UserRole
  hostels?: {
    name: string
    location: string | null
  }
}

export type CostApproval = {
  id: string
  complaint_id: string
  estimated_cost: number
  estimation_notes: string | null
  estimated_by: string
  estimated_at: string
  estimated_time_hours: number | null
  requires_external_vendor: boolean
  
  // Approval workflow
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
  approved_by: string | null
  approved_at: string | null
  approval_notes: string | null
  approved_cost: number | null
  
  created_at: string
  updated_at: string
  
  // Joined relations
  estimated_by_user?: User
  approved_by_user?: User
  complaints?: {
    id: string
    complaint_number: string
    hostel_id: string | null
    room_id: string | null
    category_id: string | null
    student_name: string
    student_contact: string
    student_email: string | null
    student_id: string | null
    title: string
    description: string
    urgency_level: number | null
    status: string | null
    priority: number | null
    created_at: string | null
    hostels?: {
      id: string
      name: string
      location: string | null
    }
    rooms?: {
      id: string
      room_number: string
      floor_number: number
    }
    complaint_categories?: {
      id: string
      name: string
      icon: string | null
      priority_level?: number | null
    }
  }
}

export type WardenAuthentication = {
  id: string
  complaint_id: string
  warden_id: string
  authentication_type: 'COMPLAINT_VERIFICATION' | 'WORK_COMPLETION'
  
  // Authentication details
  is_authenticated: boolean
  authentication_notes: string | null
  authentication_status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  
  // Evidence/photos if any
  evidence_urls: string[] | null
  
  created_at: string
  updated_at: string
  
  // Joined relations
  warden?: User
}

export type ComplaintAssignment = {
  id: string
  complaint_id: string
  staff_member_id: string
  assigned_by: string
  assigned_at: string
  assignment_reason: string | null
  assignment_stage: string | null
  
  is_current: boolean
  whatsapp_sent: boolean
  whatsapp_sent_at: string | null
  
  // Joined relations
  assigned_to_user?: User
  assigned_by_user?: User
}

export type ComplaintActivity = {
  id: string
  complaint_id: string
  activity_type: string
  description: string
  performed_by: string | null
  performed_by_name: string | null
  additional_data: Record<string, any> | null
  created_at: string
  
  // Joined relations
  performed_by_user?: User
}

export type WorkProgressUpdate = {
  id: string
  complaint_id: string
  updated_by: string
  progress_percentage: number
  status_update: string
  work_images: string[] | null
  materials_used: string | null
  workers_assigned: string | null
  next_steps: string | null
  expected_completion: string | null
  created_at: string
  
  // Joined relations
  updated_by_user?: User
}

export type ComplaintStage = 
  | 'COMPLAINT_SUBMITTED'
  | 'WARDEN_VERIFICATION'
  | 'ASSIGNED_TO_CAMPUS_IC'
  | 'COST_ESTIMATION'
  | 'COST_APPROVAL'
  | 'WORK_IN_PROGRESS'
  | 'WORK_COMPLETED'
  | 'WARDEN_WORK_VERIFICATION'
  | 'FINAL_APPROVAL'
  | 'RESOLVED'

// Extended complaint type with new workflow fields
export type EnhancedComplaint = {
  // All existing complaint fields
  id: string
  complaint_number: string
  hostel_id: string | null
  room_id: string | null
  category_id: string | null
  student_name: string
  student_contact: string
  student_email: string | null
  student_id: string | null
  title: string
  description: string
  urgency_level: number | null
  status: string | null
  priority: number | null
  assigned_to: string | null
  assigned_to_contact: string | null
  assigned_at: string | null
  estimated_resolution: string | null
  resolved_at: string | null
  resolution_notes: string | null
  estimated_cost: number | null
  actual_cost: number | null
  cost_category: string | null
  cost_notes: string | null
  cost_estimated_by: string | null
  cost_estimated_at: string | null
  cost_approved: boolean | null
  cost_approved_by: string | null
  cost_approved_at: string | null
  created_at: string | null
  updated_at: string | null
  created_by_ip: string | null
  student_rating: number | null
  student_feedback: string | null
  
  // New workflow fields
  warden_verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  warden_verified_by: string | null
  warden_verified_at: string | null
  work_completion_verified: boolean
  work_verified_by: string | null
  work_verified_at: string | null
  current_stage: ComplaintStage
  
  // Joined relations
  hostels?: {
    name: string
    location: string | null
  }
  rooms?: {
    room_number: string
    floor_number: number
  }
  complaint_categories?: {
    name: string
    icon: string | null
    priority_level?: number | null
  }
  cost_approvals?: CostApproval[]
  warden_authentications?: WardenAuthentication[]
  complaint_assignments?: ComplaintAssignment[]
  complaint_activities?: ComplaintActivity[]
  work_progress_updates?: WorkProgressUpdate[]
}

// Context type for current user
export type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  hasPermission: (permission: string) => boolean
}

// Permission checking utility type
export type Permission = keyof UserRole['permissions'] 