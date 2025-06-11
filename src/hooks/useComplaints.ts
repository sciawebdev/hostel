import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/react-query'
import { toast } from 'sonner'
import type { Complaint } from '../lib/supabase'

export function useComplaints() {
  return useQuery({
    queryKey: queryKeys.complaints,
    queryFn: async (): Promise<Complaint[]> => {
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          hostels(name, location),
          complaint_categories(name, icon)
        `)
        .order('created_at', { ascending: false })
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data || []
    },
  })
}

export function useComplaintsByStatus(status: string) {
  return useQuery({
    queryKey: queryKeys.complaintsByStatus(status),
    queryFn: async (): Promise<Complaint[]> => {
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          hostels(name, location),
          complaint_categories(name, icon)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false })
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data || []
    },
  })
}

export function useComplaintsByHostel(hostelId: string) {
  return useQuery({
    queryKey: queryKeys.complaintsByHostel(hostelId),
    queryFn: async (): Promise<Complaint[]> => {
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          hostels(name, location),
          complaint_categories(name, icon)
        `)
        .eq('hostel_id', hostelId)
        .order('created_at', { ascending: false })
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data || []
    },
    enabled: !!hostelId,
  })
}

export function useComplaint(id: string) {
  return useQuery({
    queryKey: queryKeys.complaint(id),
    queryFn: async (): Promise<Complaint | null> => {
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          hostels(name, location),
          complaint_categories(name, icon, priority_level)
        `)
        .eq('id', id)
        .single()
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data
    },
    enabled: !!id,
  })
}

// Mutation for updating complaint status
export function useUpdateComplaintStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (status === 'RESOLVED') {
        updateData.resolved_at = new Date().toISOString()
        if (notes) {
          updateData.resolution_notes = notes
        }
      }

      const { data, error } = await supabase
        .from('complaints')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Add activity log
      await supabase.from('complaint_activities').insert([
        {
          complaint_id: id,
          activity_type: 'STATUS_UPDATED',
          description: `Status changed to ${status}`,
          performed_by: 'Admin', // TODO: Get from auth context
        }
      ])

      return data
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.complaints })
      toast.success('Complaint status updated successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to update complaint status', {
        description: error.message,
      })
    },
  })
}

// Mutation for assigning complaint to staff
export function useAssignComplaint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      complaintId, 
      staffMemberId, 
      staffName, 
      estimatedResolution 
    }: { 
      complaintId: string
      staffMemberId: string
      staffName: string
      estimatedResolution?: string 
    }) => {
      // Update complaint
      const updateData: any = {
        assigned_to: staffName,
        assigned_at: new Date().toISOString(),
        status: 'IN_PROGRESS',
        updated_at: new Date().toISOString(),
      }

      if (estimatedResolution) {
        updateData.estimated_resolution = estimatedResolution
      }

      const { error: complaintError } = await supabase
        .from('complaints')
        .update(updateData)
        .eq('id', complaintId)

      if (complaintError) {
        throw new Error(complaintError.message)
      }

      // Create assignment record
      const { error: assignmentError } = await supabase
        .from('complaint_assignments')
        .insert([
          {
            complaint_id: complaintId,
            staff_member_id: staffMemberId,
            assigned_by: 'Admin', // TODO: Get from auth context
            is_current: true,
          }
        ])

      if (assignmentError) {
        throw new Error(assignmentError.message)
      }

      // Add activity log
      await supabase.from('complaint_activities').insert([
        {
          complaint_id: complaintId,
          activity_type: 'ASSIGNED',
          description: `Assigned to ${staffName}`,
          performed_by: 'Admin', // TODO: Get from auth context
        }
      ])

      return { complaintId, staffMemberId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.complaints })
      toast.success('Complaint assigned successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to assign complaint', {
        description: error.message,
      })
    },
  })
} 