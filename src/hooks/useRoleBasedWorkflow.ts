import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, COMPLAINT_WORKFLOW_STATUS } from '../lib/supabase'
import { toast } from 'sonner'
import type { 
  CostApproval, 
  WardenAuthentication, 
  ComplaintAssignment, 
  WorkProgressUpdate,
  ComplaintActivity 
} from '../types/auth'
import type { ComplaintWorkflowStatus } from '../lib/supabase'

// Updated automated workflow stages
export const WORKFLOW_STAGES = {
  PENDING_WARDEN_VERIFICATION: 'PENDING_WARDEN_VERIFICATION',
  VERIFIED_BY_WARDEN: 'VERIFIED_BY_WARDEN', // Auto-moves to cost estimation
  AWAITING_COST_ESTIMATE: 'AWAITING_COST_ESTIMATE',
  COST_ESTIMATED: 'COST_ESTIMATED', // Auto-moves to admin approval
  PENDING_ADMIN_APPROVAL: 'PENDING_ADMIN_APPROVAL',
  APPROVED_FOR_WORK: 'APPROVED_FOR_WORK', // Auto-moves to work execution
  WORK_IN_PROGRESS: 'WORK_IN_PROGRESS',
  WORK_COMPLETED: 'WORK_COMPLETED', // Auto-moves to admin final review
  PENDING_FINAL_REVIEW: 'PENDING_FINAL_REVIEW',
  RESOLVED: 'RESOLVED'
} as const

export type WorkflowStage = keyof typeof WORKFLOW_STAGES

// Automated workflow transition function
async function autoTransitionWorkflow(complaintId: string, currentStage: ComplaintWorkflowStatus, triggeredBy: string) {
  try {
    let nextStage: ComplaintWorkflowStatus | null = null
    let activityDescription = ''

    switch (currentStage) {
      case COMPLAINT_WORKFLOW_STATUS.VERIFIED:
        nextStage = COMPLAINT_WORKFLOW_STATUS.ASSIGNED_TO_CAMPUS_IC
        activityDescription = 'Auto-assigned to Campus In-Charge after warden verification.'
        // Here you would also add logic to actually assign it to a user
        break

      case COMPLAINT_WORKFLOW_STATUS.PROPOSAL_SUBMITTED:
        nextStage = COMPLAINT_WORKFLOW_STATUS.PROPOSAL_APPROVED // Or a pending state
        activityDescription = 'Proposal submitted, awaiting Admin approval.'
        break
        
      case COMPLAINT_WORKFLOW_STATUS.PROPOSAL_APPROVED:
        nextStage = COMPLAINT_WORKFLOW_STATUS.WORK_IN_PROGRESS
        activityDescription = 'Proposal approved, work can now begin.'
        break

      case COMPLAINT_WORKFLOW_STATUS.WORK_DONE:
        nextStage = COMPLAINT_WORKFLOW_STATUS.WORK_VERIFICATION_PENDING
        activityDescription = 'Work is done, awaiting Warden verification.'
        break
        
      case COMPLAINT_WORKFLOW_STATUS.WORK_VERIFIED:
        nextStage = COMPLAINT_WORKFLOW_STATUS.RESOLVED // Or awaiting final admin closure
        activityDescription = 'Work verified by Warden.'
        break
    }

    if (nextStage) {
      // Update complaint status
      await supabase
        .from('complaints')
        .update({ status: nextStage })
        .eq('id', complaintId)

      // Log the auto-transition
      await supabase.from('complaint_activities').insert([
        {
          complaint_id: complaintId,
          activity_type: 'STATUS_CHANGED',
          description: activityDescription,
          performed_by: `System (triggered by ${triggeredBy})`,
        }
      ])

      console.log(`Auto-transitioned complaint ${complaintId} from ${currentStage} to ${nextStage}`)
    }
  } catch (error) {
    console.error('Auto-transition failed:', error)
  }
}

// Cost Approval Hooks
export function useCostApprovals(complaintId?: string) {
  return useQuery({
    queryKey: ['cost-approvals', complaintId],
    queryFn: async (): Promise<CostApproval[]> => {
      let query = supabase
        .from('cost_approvals')
        .select(`
          *,
          estimated_by_user:app_users!estimated_by(id, name, email),
          approved_by_user:app_users!approved_by(id, name, email),
          complaints!inner(
            *,
            hostels(id, name, location),
            rooms(id, room_number, floor_number),
            complaint_categories(id, name, icon, priority_level)
          )
        `)
        .order('created_at', { ascending: false })

      if (complaintId) {
        query = query.eq('complaint_id', complaintId)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    enabled: !!complaintId || complaintId === undefined,
  })
}

export function useCreateCostApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (costData: {
      complaint_id: string
      estimated_cost: number
      cost_breakdown: string
      estimated_by: string
      estimated_time_hours?: number
      requires_external_vendor?: boolean
    }) => {
      const { data, error } = await supabase
        .from('cost_approvals')
        .insert([{
          complaint_id: costData.complaint_id,
          estimated_cost: costData.estimated_cost,
          estimation_notes: costData.cost_breakdown,
          estimated_by: costData.estimated_by,
          estimated_time_hours: costData.estimated_time_hours,
          requires_external_vendor: costData.requires_external_vendor || false,
          status: 'PENDING_APPROVAL'
        }])
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Update complaint status to indicate cost estimation complete
      await supabase
        .from('complaints')
        .update({ status: COMPLAINT_WORKFLOW_STATUS.PROPOSAL_SUBMITTED })
        .eq('id', costData.complaint_id)

      // Log activity
      await supabase.from('complaint_activities').insert([
        {
          complaint_id: costData.complaint_id,
          activity_type: 'COST_ESTIMATED',
          description: `Cost estimated at ₹${costData.estimated_cost.toLocaleString()}`,
          performed_by: costData.estimated_by,
        }
      ])

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-approvals'] })
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      toast.success('Cost estimate submitted successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to submit cost estimate', {
        description: error.message,
      })
    },
  })
}

export function useApproveCost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      id: string
      approved_by: string
      approval_status: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED'
      approval_notes?: string
    }) => {
      const { data: result, error } = await supabase
        .from('cost_approvals')
        .update({
          approval_status: data.approval_status,
          approved_by: data.approved_by,
          approved_at: new Date().toISOString(),
          approval_notes: data.approval_notes,
        })
        .eq('id', data.id)
        .select('complaint_id')
        .single()

      if (error) {
        throw new Error(error.message)
      }
      
      const newStatus = data.approval_status === 'APPROVED' ? COMPLAINT_WORKFLOW_STATUS.PROPOSAL_APPROVED : COMPLAINT_WORKFLOW_STATUS.CLOSED;

      // Update complaint status
      if (result?.complaint_id) {
        await supabase
          .from('complaints')
          .update({ status: newStatus })
          .eq('id', result.complaint_id)
      }

      // Log activity
      await supabase.from('complaint_activities').insert([
        {
          complaint_id: result.complaint_id,
          activity_type: 'COST_APPROVED',
          description: `Cost estimate ${data.approval_status.toLowerCase()}`,
          performed_by: data.approved_by,
        }
      ])

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-approvals'] })
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      toast.success('Cost approval updated successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to update cost approval', {
        description: error.message,
      })
    },
  })
}

// Warden Authentication Hooks
export function useWardenAuthentications(complaintId?: string) {
  return useQuery({
    queryKey: ['warden-authentications', complaintId],
    queryFn: async (): Promise<WardenAuthentication[]> => {
      let query = supabase
        .from('warden_authentications')
        .select(`
          *,
          warden:app_users(id, name, email)
        `)
        .order('created_at', { ascending: false })

      if (complaintId) {
        query = query.eq('complaint_id', complaintId)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    enabled: !!complaintId || complaintId === undefined,
  })
}

export function useCreateWardenAuthentication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (authData: {
      complaint_id: string
      warden_id: string
      authentication_type: 'COMPLAINT_VERIFICATION' | 'WORK_COMPLETION'
      is_authenticated: boolean
      authentication_notes?: string
      evidence_urls?: string[]
    }) => {
      const { data, error } = await supabase
        .from('warden_authentications')
        .insert([{
          complaint_id: authData.complaint_id,
          warden_id: authData.warden_id,
          is_verified: authData.is_authenticated,
          verification_notes: authData.authentication_notes || ''
        }])
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Update complaint based on authentication type and result
      if (authData.authentication_type === 'COMPLAINT_VERIFICATION') {
        if (authData.is_authenticated) {
          await supabase
            .from('complaints')
            .update({ 
              status: 'ASSIGNED',
              updated_at: new Date().toISOString()
            })
            .eq('id', authData.complaint_id)

          // Auto-assign to campus coordinator after warden verification
          const { data: complaint, error: complaintError } = await supabase
            .from('complaints')
            .select('hostel_id')
            .eq('id', authData.complaint_id)
            .single()
            
          if (complaint?.hostel_id) {
            // Get hostel name to determine which coordinator to assign
            const { data: hostelData, error: hostelError } = await supabase
              .from('hostels')
              .select('name')
              .eq('id', complaint.hostel_id)
              .single()
              
            if (hostelData) {
              // Map hostels to coordinators (same mapping as in autoAssignComplaint)
              const hostelCoordinatorMap: Record<string, string> = {
                'Godavari': 'campus-coord-1',
                'Sarayu': 'campus-coord-1',
                'Ganga 1': 'campus-coord-2', 
                'Ganga 2': 'campus-coord-2',
                'Krishna': 'campus-coord-3',
                'Narmada': 'campus-coord-3',
                'Bhramaputra 1': 'campus-coord-4',
                'Bhramaputra 2': 'campus-coord-4',
                'Saraswathi': 'campus-coord-5',
                'Civils Lt Girls': 'campus-coord-6',
                'Benz Circle': 'campus-coord-7'
              }
              
              const assignedCoordinator = hostelCoordinatorMap[hostelData.name] || 'campus-coord-1'
              
              // Create assignment to campus coordinator
              await supabase
                .from('complaint_assignments')
                .insert([{
                  complaint_id: authData.complaint_id,
                  staff_member_id: assignedCoordinator,
                  assigned_by: authData.warden_id,
                  assignment_reason: `Auto-assigned to campus coordinator after warden verification for ${hostelData.name}`,
                  is_current: true
                }])
            }
          }
        } else {
          await supabase
            .from('complaints')
            .update({ 
              status: 'REJECTED',
              updated_at: new Date().toISOString()
            })
            .eq('id', authData.complaint_id)
        }
      } else if (authData.authentication_type === 'WORK_COMPLETION') {
        await supabase
          .from('complaints')
          .update({ 
            status: authData.is_authenticated ? 'WORK_COMPLETED' : 'WORK_IN_PROGRESS',
            updated_at: new Date().toISOString()
          })
          .eq('id', authData.complaint_id)
      }

      // Log activity
      await supabase.from('complaint_activities').insert([
        {
          complaint_id: authData.complaint_id,
          activity_type: authData.authentication_type,
          description: `${authData.authentication_type.replace('_', ' ').toLowerCase()}: ${authData.is_authenticated ? 'Verified' : 'Rejected'}`,
          performed_by: authData.warden_id,
        }
      ])

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warden-authentications'] })
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      toast.success('Authentication submitted successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to submit authentication', {
        description: error.message,
      })
    },
  })
}

// Complaint Assignment Hooks
export function useComplaintAssignments(complaintId?: string) {
  return useQuery({
    queryKey: ['complaint-assignments', complaintId],
    queryFn: async (): Promise<ComplaintAssignment[]> => {
      let query = supabase
        .from('complaint_assignments')
        .select(`
          *,
          assigned_to_user:app_users!staff_member_id(id, name, email, specialization),
          assigned_by_user:app_users!assigned_by(id, name, email)
        `)
        .order('assigned_at', { ascending: false })

      if (complaintId) {
        query = query.eq('complaint_id', complaintId)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    enabled: !!complaintId || complaintId === undefined,
  })
}

export function useAssignComplaintToUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (assignmentData: {
      complaint_id: string
      staff_member_id: string
      assigned_by: string
      assignment_reason?: string
    }) => {
      // Mark previous assignments as not current
      await supabase
        .from('complaint_assignments')
        .update({ is_current: false })
        .eq('complaint_id', assignmentData.complaint_id)

      const { data, error } = await supabase
        .from('complaint_assignments')
        .insert([{
          complaint_id: assignmentData.complaint_id,
          staff_member_id: assignmentData.staff_member_id,
          assigned_by: assignmentData.assigned_by,
          assignment_reason: assignmentData.assignment_reason,
          is_current: true
        }])
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Update complaint status
      await supabase
        .from('complaints')
        .update({ 
          status: 'ASSIGNED',
          assigned_to: assignmentData.staff_member_id,
          assigned_at: new Date().toISOString()
        })
        .eq('id', assignmentData.complaint_id)

      // Log activity
      await supabase.from('complaint_activities').insert([
        {
          complaint_id: assignmentData.complaint_id,
          activity_type: 'ASSIGNED',
          description: 'Complaint assigned to campus coordinator',
          performed_by: assignmentData.assigned_by,
        }
      ])

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaint-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      toast.success('Complaint assigned successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to assign complaint', {
        description: error.message,
      })
    },
  })
}

// Automated Assignment Function
export function useAutoAssignComplaint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      complaint_id: string
      hostel_id: string
      assigned_by: string
    }) => {
      // Get hostel name to determine which coordinator to assign
      const { data: hostelData, error: hostelError } = await supabase
        .from('hostels')
        .select('name')
        .eq('id', data.hostel_id)
        .single()

      if (hostelError) {
        throw new Error('Failed to fetch hostel information')
      }

      // Map hostels to coordinators
      const hostelCoordinatorMap: Record<string, string> = {
        'Godavari': 'campus-coord-1',
        'Sarayu': 'campus-coord-1',
        'Ganga 1': 'campus-coord-2', 
        'Ganga 2': 'campus-coord-2',
        'Krishna': 'campus-coord-3',
        'Narmada': 'campus-coord-3',
        'Bhramaputra 1': 'campus-coord-4',
        'Bhramaputra 2': 'campus-coord-4',
        'Saraswathi': 'campus-coord-5',
        'Civils Lt Girls': 'campus-coord-6',
        'Benz Circle': 'campus-coord-7'
      }

      const assignedCoordinator = hostelCoordinatorMap[hostelData.name] || 'campus-coord-1'

      // Mark previous assignments as not current
      await supabase
        .from('complaint_assignments')
        .update({ is_current: false })
        .eq('complaint_id', data.complaint_id)

      // Create new assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('complaint_assignments')
        .insert([{
          complaint_id: data.complaint_id,
          staff_member_id: assignedCoordinator,
          assigned_by: data.assigned_by,
          assignment_reason: `Auto-assigned based on hostel: ${hostelData.name}`,
          is_current: true
        }])
        .select()
        .single()

      if (assignmentError) {
        throw new Error('Failed to create assignment')
      }

      // Update complaint status
      await supabase
        .from('complaints')
        .update({ 
          status: 'ASSIGNED',
          assigned_to: assignedCoordinator,
          assigned_at: new Date().toISOString()
        })
        .eq('id', data.complaint_id)

      // Log activity
      await supabase.from('complaint_activities').insert([
        {
          complaint_id: data.complaint_id,
          activity_type: 'AUTO_ASSIGNED',
          description: `Automatically assigned to ${hostelData.name} campus coordinator`,
          performed_by: data.assigned_by,
        }
      ])

      return assignmentData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaint-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      toast.success('Complaint auto-assigned successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to auto-assign complaint', {
        description: error.message,
      })
    },
  })
}

// Work Progress Updates Hooks
export function useWorkProgressUpdates(complaintId: string) {
  return useQuery({
    queryKey: ['work-progress-updates', complaintId],
    queryFn: async (): Promise<WorkProgressUpdate[]> => {
      const { data, error } = await supabase
        .from('work_progress_updates')
        .select(`
          *,
          updated_by_user:app_users(id, name, email)
        `)
        .eq('complaint_id', complaintId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    enabled: !!complaintId,
  })
}

export function useCreateWorkProgressUpdate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updateData: {
      complaint_id: string
      updated_by: string
      progress_percentage: number
      status_update: string
      work_images?: string[]
      materials_used?: string
      workers_assigned?: string
      next_steps?: string
      expected_completion?: string
    }) => {
      const { data, error } = await supabase
        .from('work_progress_updates')
        .insert([updateData])
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Update complaint stage if work is completed
      if (updateData.progress_percentage >= 100) {
        await supabase
          .from('complaints')
          .update({ current_stage: 'WORK_COMPLETED' })
          .eq('id', updateData.complaint_id)
      }

      // Log activity
      await supabase.from('complaint_activities').insert([
        {
          complaint_id: updateData.complaint_id,
          activity_type: 'WORK_PROGRESS_UPDATED',
          description: `Work progress: ${updateData.progress_percentage}% - ${updateData.status_update}`,
          performed_by: updateData.updated_by,
        }
      ])

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-progress-updates'] })
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      toast.success('Work progress updated successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to update work progress', {
        description: error.message,
      })
    },
  })
}

// Final complaint resolution (Admin only)
export function useResolveComplaint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      complaint_id: string
      resolved_by: string
      resolution_notes?: string
    }) => {
      const { error } = await supabase
        .from('complaints')
        .update({
          status: 'RESOLVED',
          current_stage: 'RESOLVED',
          resolved_at: new Date().toISOString(),
          resolution_notes: data.resolution_notes,
        })
        .eq('id', data.complaint_id)

      if (error) {
        throw new Error(error.message)
      }

      // Log activity
      await supabase.from('complaint_activities').insert([
        {
          complaint_id: data.complaint_id,
          activity_type: 'COMPLAINT_RESOLVED',
          description: 'Complaint marked as resolved by administrator',
          performed_by: data.resolved_by,
        }
      ])

      return { complaint_id: data.complaint_id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      toast.success('Complaint resolved successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to resolve complaint', {
        description: error.message,
      })
    },
  })
}

// Complaint Activities Hook
export function useComplaintActivities(complaintId: string) {
  return useQuery({
    queryKey: ['complaint-activities', complaintId],
    queryFn: async (): Promise<ComplaintActivity[]> => {
      const { data, error } = await supabase
        .from('complaint_activities')
        .select(`
          *,
          performed_by_user:app_users(id, name, email)
        `)
        .eq('complaint_id', complaintId)
        .order('performed_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    enabled: !!complaintId,
  })
}

// Warden verification hook
export function useFloorInchargeVerification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      complaintId, 
      verified, 
      notes, 
      floorInchargeId 
    }: { 
      complaintId: string
      verified: boolean
      notes: string
      floorInchargeId: string
    }) => {
      if (verified) {
        // Insert floor incharge authentication record
        const { error: authError } = await supabase
          .from('warden_authentications')
          .insert([{
            complaint_id: complaintId,
            floor_incharge_id: floorInchargeId,
            is_verified: true,
            verification_notes: notes,
            verified_at: new Date().toISOString()
          }])

        if (authError) throw authError

        // Update complaint status to verified
        const { error: updateError } = await supabase
          .from('complaints')
          .update({ status: COMPLAINT_WORKFLOW_STATUS.VERIFIED })
          .eq('id', complaintId)

        if (updateError) throw updateError

        // Log activity
        await supabase.from('complaint_activities').insert([
          {
            complaint_id: complaintId,
            activity_type: 'VERIFIED',
            description: `Complaint verified by floor incharge: ${notes}`,
            performed_by: floorInchargeId,
          }
        ])

        // Auto-transition to cost estimation
        await autoTransitionWorkflow(complaintId, COMPLAINT_WORKFLOW_STATUS.VERIFIED, floorInchargeId)

      } else {
        // Reject the complaint
        await supabase
          .from('complaints')
          .update({ status: COMPLAINT_WORKFLOW_STATUS.CLOSED })
          .eq('id', complaintId)

        await supabase.from('complaint_activities').insert([
          {
            complaint_id: complaintId,
            activity_type: 'REJECTED',
            description: `Complaint rejected by floor incharge: ${notes}`,
            performed_by: floorInchargeId,
          }
        ])
      }

      return { verified, complaintId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      queryClient.invalidateQueries({ queryKey: ['warden-authentications'] })
      
      toast.success(
        data.verified ? 'Complaint Verified & Auto-Assigned for Cost Estimation' : 'Complaint Rejected',
        {
          description: data.verified 
            ? 'Complaint has been automatically moved to campus coordinator for cost estimation'
            : 'Complaint has been rejected and marked accordingly',
          duration: 5000,
        }
      )
    },
    onError: (error: Error) => {
      toast.error('Verification Failed', {
        description: error.message,
        duration: 5000,
      })
    },
  })
}

// Campus coordinator cost estimation hook
export function useCostEstimation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      complaintId,
      estimatedCost,
      estimationNotes,
      estimatedBy,
      estimatedTimeHours,
      requiresExternalVendor
    }: {
      complaintId: string
      estimatedCost: number
      estimationNotes: string
      estimatedBy: string
      estimatedTimeHours?: number
      requiresExternalVendor?: boolean
    }) => {
      // Insert cost approval record
      const { error: costError } = await supabase
        .from('cost_approvals')
        .insert([{
          complaint_id: complaintId,
          estimated_cost: estimatedCost,
          estimation_notes: estimationNotes,
          estimated_by: estimatedBy,
          estimated_time_hours: estimatedTimeHours,
          requires_external_vendor: requiresExternalVendor || false,
          status: 'PENDING_APPROVAL'
        }])

      if (costError) throw costError

      // Update complaint status
      await supabase
        .from('complaints')
        .update({ status: COMPLAINT_WORKFLOW_STATUS.PROPOSAL_SUBMITTED })
        .eq('id', complaintId)

      // Log activity
      await supabase.from('complaint_activities').insert([
        {
          complaint_id: complaintId,
          activity_type: 'COST_ESTIMATED',
          description: `Cost estimated at ₹${estimatedCost.toLocaleString()} by ${estimatedBy}. Notes: ${estimationNotes}`,
          performed_by: estimatedBy,
        }
      ])

      // Auto-transition to admin approval
      await autoTransitionWorkflow(complaintId, COMPLAINT_WORKFLOW_STATUS.PROPOSAL_SUBMITTED, estimatedBy)

      return { complaintId, estimatedCost }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      queryClient.invalidateQueries({ queryKey: ['cost-approvals'] })
      
      toast.success('Cost Estimate Submitted & Auto-Sent for Approval', {
        description: `₹${data.estimatedCost.toLocaleString()} estimate sent to administrator for approval`,
        duration: 5000,
      })
    },
    onError: (error: Error) => {
      toast.error('Cost Estimation Failed', {
        description: error.message,
        duration: 5000,
      })
    },
  })
}

// Administrator cost approval hook
export function useCostApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      complaintId,
      approved,
      approvalNotes,
      approvedBy,
      approvedCost
    }: {
      complaintId: string
      approved: boolean
      approvalNotes: string
      approvedBy: string
      approvedCost?: number
    }) => {
      if (approved) {
        // Update cost approval record
        await supabase
          .from('cost_approvals')
          .update({
            status: 'APPROVED',
            approved_cost: approvedCost,
            approval_notes: approvalNotes,
            approved_by: approvedBy,
            approved_at: new Date().toISOString()
          })
          .eq('complaint_id', complaintId)
          .eq('status', 'PENDING_APPROVAL')

        // Update complaint status
        await supabase
          .from('complaints')
          .update({ status: COMPLAINT_WORKFLOW_STATUS.PROPOSAL_APPROVED })
          .eq('id', complaintId)

        // Log activity
        await supabase.from('complaint_activities').insert([
          {
            complaint_id: complaintId,
            activity_type: 'APPROVED',
            description: `Cost approved by administrator at ₹${(approvedCost || 0).toLocaleString()}. Notes: ${approvalNotes}`,
            performed_by: approvedBy,
          }
        ])

        // Auto-transition to work execution
        await autoTransitionWorkflow(complaintId, COMPLAINT_WORKFLOW_STATUS.PROPOSAL_APPROVED, approvedBy)

      } else {
        // Reject the cost estimate
        await supabase
          .from('cost_approvals')
          .update({
            status: 'REJECTED',
            approval_notes: approvalNotes,
            approved_by: approvedBy,
            approved_at: new Date().toISOString()
          })
          .eq('complaint_id', complaintId)
          .eq('status', 'PENDING_APPROVAL')

        await supabase
          .from('complaints')
          .update({ status: COMPLAINT_WORKFLOW_STATUS.CLOSED })
          .eq('id', complaintId)

        await supabase.from('complaint_activities').insert([
          {
            complaint_id: complaintId,
            activity_type: 'REJECTED',
            description: `Cost estimate rejected by administrator. Notes: ${approvalNotes}`,
            performed_by: approvedBy,
          }
        ])
      }

      return { approved, complaintId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      queryClient.invalidateQueries({ queryKey: ['cost-approvals'] })
      
      toast.success(
        data.approved ? 'Cost Approved & Auto-Assigned for Work' : 'Cost Estimate Rejected',
        {
          description: data.approved 
            ? 'Work has been automatically assigned to campus coordinator for execution'
            : 'Cost estimate rejected and sent back for revision',
          duration: 5000,
        }
      )
    },
    onError: (error: Error) => {
      toast.error('Approval Failed', {
        description: error.message,
        duration: 5000,
      })
    },
  })
}

// Campus coordinator work completion hook
export function useWorkCompletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      complaintId,
      actualCost,
      workNotes,
      completedBy,
      vendorDetails,
      materialsUsed,
      workDurationHours,
      qualityRating
    }: {
      complaintId: string
      actualCost: number
      workNotes: string
      completedBy: string
      vendorDetails?: string
      materialsUsed?: string
      workDurationHours?: number
      qualityRating?: number
    }) => {
      // Update complaint with completion details
      await supabase
        .from('complaints')
        .update({ 
          status: COMPLAINT_WORKFLOW_STATUS.WORK_DONE,
          actual_cost: actualCost,
          work_completion_notes: workNotes,
          vendor_details: vendorDetails,
          materials_used: materialsUsed,
          work_duration_hours: workDurationHours,
          quality_rating: qualityRating,
          completed_by: completedBy,
          completed_at: new Date().toISOString()
        })
        .eq('id', complaintId)

      // Log detailed completion activity
      await supabase.from('complaint_activities').insert([
        {
          complaint_id: complaintId,
          activity_type: 'WORK_COMPLETED',
          description: `Work completed by ${completedBy}. Actual cost: ₹${actualCost.toLocaleString()}. ${workNotes}${vendorDetails ? ` Vendor: ${vendorDetails}` : ''}${materialsUsed ? ` Materials: ${materialsUsed}` : ''}`,
          performed_by: completedBy,
        }
      ])

      // Auto-transition to final review
      await autoTransitionWorkflow(complaintId, COMPLAINT_WORKFLOW_STATUS.WORK_DONE, completedBy)

      return { complaintId, actualCost }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      
      toast.success('Work Completed & Auto-Sent for Final Review', {
        description: `Work completion details sent to administrator for final resolution`,
        duration: 5000,
      })
    },
    onError: (error: Error) => {
      toast.error('Work Completion Failed', {
        description: error.message,
        duration: 5000,
      })
    },
  })
}

// Administrator final resolution hook
export function useFinalResolution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      complaintId,
      resolutionNotes,
      resolvedBy,
      satisfactionRating,
      lessonsLearned
    }: {
      complaintId: string
      resolutionNotes: string
      resolvedBy: string
      satisfactionRating?: number
      lessonsLearned?: string
    }) => {
      // Final resolution update
      await supabase
        .from('complaints')
        .update({ 
          status: COMPLAINT_WORKFLOW_STATUS.RESOLVED,
          resolution_notes: resolutionNotes,
          resolved_by: resolvedBy,
          resolved_at: new Date().toISOString(),
          satisfaction_rating: satisfactionRating,
          lessons_learned: lessonsLearned
        })
        .eq('id', complaintId)

      // Final activity log
      await supabase.from('complaint_activities').insert([
        {
          complaint_id: complaintId,
          activity_type: 'RESOLVED',
          description: `Complaint resolved by administrator. ${resolutionNotes}${lessonsLearned ? ` Lessons learned: ${lessonsLearned}` : ''}`,
          performed_by: resolvedBy,
        }
      ])

      return { complaintId }
    },
    onSuccess: () => {
      toast.success('Complaint has been successfully resolved and closed.')
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
    },
    onError: (error: Error) => {
      toast.error('Resolution Failed', {
        description: error.message,
        duration: 5000,
      })
    },
  })
}

// Automated Workflow System
export function useAutomatedWorkflow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      complaint_id: string
      action: 'AUTO_VERIFY' | 'AUTO_ASSIGN' | 'AUTO_ESTIMATE' | 'AUTO_APPROVE' | 'AUTO_COMPLETE' | 'AUTO_RESOLVE'
      performer_id: string
      notes?: string
    }) => {
      const { complaint_id, action, performer_id, notes } = data

      // Get current complaint status
      const { data: complaint, error: complaintError } = await supabase
        .from('complaints')
        .select('*')
        .eq('id', complaint_id)
        .single()

      if (complaintError || !complaint) {
        throw new Error('Complaint not found')
      }

      let updatedStatus = complaint.status
      let activityDescription = ''

      switch (action) {
        case 'AUTO_VERIFY':
          // Warden verification - automatically approve
          updatedStatus = COMPLAINT_WORKFLOW_STATUS.VERIFIED
          activityDescription = 'Automatically verified by warden'
          
          // Create warden authentication record
          await supabase.from('warden_authentications').insert([{
            complaint_id,
            warden_id: performer_id,
            is_verified: true,
            verification_notes: notes || 'Auto-verified through automated workflow'
          }])
          break

        case 'AUTO_ASSIGN':
          // Auto-assign to campus coordinator
          updatedStatus = COMPLAINT_WORKFLOW_STATUS.ASSIGNED_TO_CAMPUS_IC
          activityDescription = 'Automatically assigned to campus coordinator'
          break

        case 'AUTO_ESTIMATE':
          // Auto-create cost estimate
          updatedStatus = COMPLAINT_WORKFLOW_STATUS.PROPOSAL_SUBMITTED
          activityDescription = 'Cost automatically estimated'
          
          // Create cost approval record
          await supabase.from('cost_approvals').insert([{
            complaint_id,
            estimated_cost: 500.00, // Default estimate
            estimation_notes: notes || 'Auto-estimated cost for standard maintenance',
            estimated_by: performer_id,
            status: 'PENDING_APPROVAL'
          }])
          break

        case 'AUTO_APPROVE':
          // Auto-approve cost
          updatedStatus = COMPLAINT_WORKFLOW_STATUS.PROPOSAL_APPROVED
          activityDescription = 'Cost automatically approved'
          
          // Update cost approval
          await supabase
            .from('cost_approvals')
            .update({
              status: 'APPROVED',
              approved_by: performer_id,
              approved_at: new Date().toISOString(),
              approval_notes: notes || 'Auto-approved through automated workflow',
              approved_cost: 500.00
            })
            .eq('complaint_id', complaint_id)
            .eq('status', 'PENDING_APPROVAL')
          break

        case 'AUTO_COMPLETE':
          // Auto-complete work
          updatedStatus = COMPLAINT_WORKFLOW_STATUS.WORK_DONE
          activityDescription = 'Work automatically marked as completed'
          break

        case 'AUTO_RESOLVE':
          // Auto-resolve complaint
          updatedStatus = COMPLAINT_WORKFLOW_STATUS.RESOLVED
          activityDescription = 'Complaint automatically resolved'
          
          await supabase
            .from('complaints')
            .update({
              resolved_at: new Date().toISOString(),
              resolved_by: performer_id,
              resolution_notes: notes || 'Resolved through automated workflow',
              satisfaction_rating: 4 // Default good rating
            })
            .eq('id', complaint_id)
          break
      }

      // Update complaint status
      const { error: updateError } = await supabase
        .from('complaints')
        .update({
          status: updatedStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', complaint_id)

      if (updateError) {
        throw new Error('Failed to update complaint status')
      }

      // Log activity
      await supabase.from('complaint_activities').insert([{
        complaint_id,
        activity_type: action,
        description: activityDescription,
        performed_by: performer_id
      }])

      return { complaint_id, new_status: updatedStatus, action }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      queryClient.invalidateQueries({ queryKey: ['cost-approvals'] })
      queryClient.invalidateQueries({ queryKey: ['warden-authentications'] })
      queryClient.invalidateQueries({ queryKey: ['complaint-activities'] })
      
      toast.success(`Automated workflow completed: ${data.action}`, {
        description: `Complaint moved to ${data.new_status}`
      })
    },
    onError: (error: Error) => {
      toast.error('Automated workflow failed', {
        description: error.message
      })
    }
  })
}

// Complete automated flow for a complaint
export function useCompleteAutomatedFlow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      complaint_id,
      performer_id
    }: {
      complaint_id: string
      performer_id: string
    }) => {

      const { data: complaint, error: fetchError } = await supabase
        .from('complaints')
        .select('status')
        .eq('id', complaint_id)
        .single()
      
      if (fetchError || !complaint) {
        throw new Error(fetchError?.message || 'Complaint not found')
      }

      const currentStatus = complaint.status as ComplaintWorkflowStatus

      await autoTransitionWorkflow(complaint_id, currentStatus, performer_id)

      return { complaint_id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      queryClient.invalidateQueries({ queryKey: ['complaint-activities'] })
      toast.success('Workflow advanced to the next stage.')
    },
    onError: (error: Error) => {
      toast.error('Failed to advance workflow', {
        description: error.message
      })
    }
  })
}

// Get assignments for a specific staff member
export function useComplaintAssignmentsByStaff(staffMemberId?: string) {
  return useQuery({
    queryKey: ['complaint-assignments-by-staff', staffMemberId],
    queryFn: async (): Promise<ComplaintAssignment[]> => {
      if (!staffMemberId) return []
      
      const { data, error } = await supabase
        .from('complaint_assignments')
        .select(`
          *,
          assigned_to_user:app_users!staff_member_id(id, name, email, specialization),
          assigned_by_user:app_users!assigned_by(id, name, email)
        `)
        .eq('staff_member_id', staffMemberId)
        .eq('is_current', true)
        .order('assigned_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    enabled: !!staffMemberId,
  })
} 