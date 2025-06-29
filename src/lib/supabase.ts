import { createClient } from "@supabase/supabase-js"

// Supabase configuration for Hostel Management System
const supabaseUrl = 'https://kluntdprhebbypvmhalv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsdW50ZHByaGViYnlwdm1oYWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NzAzNDMsImV4cCI6MjA2NTE0NjM0M30.AbBZ4AlSki_3eZrZUkMjrqgTLb5epUji3NBGT6i_4oQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'hostel-management-mobile-app',
    },
  },
  db: {
    schema: 'public',
  },
})

// Helper types for the application
export type Hostel = {
  id: string
  name: string
  location: string | null
  total_floors: number
  floor_incharge_name: string | null
  floor_incharge_contact: string | null
  created_at: string | null
  updated_at: string | null
}

export type Room = {
  id: string
  hostel_id: string | null
  room_number: string
  floor_number: number
  capacity: number | null
  room_type: string | null
  is_occupied: boolean | null
  created_at: string | null
}

export type ComplaintCategory = {
  id: string
  name: string
  description: string | null
  icon: string | null
  priority_level: number | null
  estimated_resolution_hours: number | null
  created_at: string | null
}

export type Complaint = {
  id: string
  complaint_number: string
  hostel_id: string | null
  room_id: string | null
  room_number: string | null
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
  
  // New work completion fields
  work_completion_notes: string | null
  vendor_details: string | null
  materials_used: string | null
  work_duration_hours: number | null
  quality_rating: number | null
  completed_by: string | null
  completed_at: string | null
  
  // New resolution fields
  resolved_by: string | null
  satisfaction_rating: number | null
  lessons_learned: string | null
  
  // New workflow fields - updated for floor incharge
  floor_incharge_verification_status?: 'PENDING' | 'VERIFIED' | 'REJECTED'
  floor_incharge_verified_by?: string | null
  floor_incharge_verified_at?: string | null
  work_completion_verified?: boolean
  work_verified_by?: string | null
  work_verified_at?: string | null
  current_stage?: 'COMPLAINT_SUBMITTED' | 'FLOOR_INCHARGE_VERIFICATION' | 'ASSIGNED_TO_CAMPUS_IC' | 'COST_ESTIMATION' | 'COST_APPROVAL' | 'WORK_IN_PROGRESS' | 'WORK_COMPLETED' | 'FLOOR_INCHARGE_WORK_VERIFICATION' | 'FINAL_APPROVAL' | 'RESOLVED'
  
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
}

export type StaffMember = {
  id: string
  name: string
  contact: string
  whatsapp_number: string | null
  email: string | null
  specialization: string | null
  is_active: boolean | null
  created_at: string | null
}

// Status constants
export const COMPLAINT_STATUS = {
  PENDING: 'PENDING',
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const

export const URGENCY_LEVELS = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
} as const

export const PRIORITY_LEVELS = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
} as const

export const COMPLAINT_WORKFLOW_STATUS = {
  VERIFICATION_PENDING: 'VERIFICATION_PENDING',
  VERIFIED: 'VERIFIED',
  PENDING_ADMIN_ASSIGNMENT: 'PENDING_ADMIN_ASSIGNMENT',
  ASSIGNED_TO_CAMPUS_IC: 'ASSIGNED_TO_CAMPUS_IC',
  COST_ESTIMATION_PENDING: 'COST_ESTIMATION_PENDING',
  PROPOSAL_SUBMITTED: 'PROPOSAL_SUBMITTED',
  PROPOSAL_APPROVED: 'PROPOSAL_APPROVED',
  WORK_IN_PROGRESS: 'WORK_IN_PROGRESS',
  WORK_DONE: 'WORK_DONE',
  WORK_VERIFICATION_PENDING: 'WORK_VERIFICATION_PENDING',
  WORK_VERIFIED: 'WORK_VERIFIED',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const

export type ComplaintWorkflowStatus = keyof typeof COMPLAINT_WORKFLOW_STATUS; 