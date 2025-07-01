import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, COMPLAINT_WORKFLOW_STATUS } from '../lib/supabase'
import { queryKeys } from '../lib/react-query'
import { toast } from 'sonner'
import { ComplaintNotifications } from '../lib/notificationService'
import { useOfflineSync } from '../lib/offlineSync'

export interface ComplaintSubmissionData {
  hostel_id: string
  room_text: string  // Changed from room_id to room_text for simplicity
  category_id: string
  student_name: string
  student_contact?: string
  student_email?: string
  student_id?: string
  title: string
  description: string
  urgency_level: number
}

// Simple complaint numbering system - hostel code + serial number
const generateSimpleComplaintNumber = async (hostelId: string) => {
  // Get hostel prefix from hostel name using database lookup
  const getHostelPrefix = async (hostelId: string): Promise<string> => {
    try {
    const { data: hostel } = await supabase
      .from('hostels')
        .select('name')
      .eq('id', hostelId)
      .single()

      if (!hostel?.name) return 'HMS'

      const name = hostel.name.toLowerCase()
      
      // Map hostel names to prefixes
      if (name.includes('godavari')) return 'GD'
      if (name.includes('sarayu')) return 'SR'
      if (name.includes('ganga 1') || name === 'ganga 1') return 'GN1'
      if (name.includes('ganga 2') || name === 'ganga 2') return 'GN2'
      if (name.includes('ganga') && !name.includes('1') && !name.includes('2')) return 'GN'
      if (name.includes('krishna')) return 'KR'
      if (name.includes('bhramaputra 1') || name.includes('brahmaputra 1')) return 'BR1'
      if (name.includes('bhramaputra 2') || name.includes('brahmaputra 2')) return 'BR2'
      if (name.includes('bhramaputra') || name.includes('brahmaputra')) return 'BR'
      if (name.includes('narmada')) return 'NR'
      if (name.includes('saraswathi')) return 'SW'
      if (name.includes('civils') || name.includes('girls')) return 'CG'
      if (name.includes('benz')) return 'BC'
      
      return 'HMS' // Default fallback
    } catch {
      return 'HMS' // Error fallback
    }
  }

  const prefix = await getHostelPrefix(hostelId)
  
  // Get the total count of all complaints to generate serial number
  try {
    const { count } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })

    // Serial number starts from 1, padded to 4 digits
    const serialNumber = ((count || 0) + 1).toString().padStart(4, '0')
    
    // Format: PP#### (e.g., GD0001, GN0002)
    const complaintNumber = `${prefix}${serialNumber}`

    return {
      complaintNumber,
      metadata: {
        hostelPrefix: prefix,
        serialNumber,
        description: `Simple complaint number - ${prefix} series`
      }
    }
  } catch (error) {
    console.warn('Serial number generation failed, using timestamp fallback:', error)
    // Fallback to timestamp-based numbering if database query fails
    const timestamp = Date.now().toString().slice(-4)
    const complaintNumber = `${prefix}${timestamp}`
    
    return {
      complaintNumber,
      metadata: {
        hostelPrefix: prefix,
        serialNumber: timestamp,
        description: `Fallback complaint number - ${prefix} series`
      }
    }
  }
}

// Instant IP detection - no external calls
const getInstantIP = (): string => {
  // For development/localhost, return a valid IP instantly
  // In production, you could use request headers or server-side detection
  return '127.0.0.1'
}

// Fast hostel-to-warden mapping (no database queries)
const getWardenForHostel = (hostelId: string): string => {
  const wardenMapping: Record<string, string> = {
    'hostel-godavari': 'warden-godavari',
    'hostel-sarayu': 'warden-sarayu', 
    'hostel-ganga1': 'warden-ganga1',
    'hostel-ganga2': 'warden-ganga2',
    'hostel-krishna': 'warden-krishna',
    'hostel-bhramaputra1': 'warden-brahmaputra1',
    'hostel-bhramaputra2': 'warden-brahmaputra2',
    'hostel-narmada': 'warden-narmada',
    'hostel-saraswathi': 'warden-saraswathi',
    'hostel-civils-lt-girls': 'warden-civils-girls',
    'hostel-benz-circle': 'warden-benz-circle'
  }
  return wardenMapping[hostelId] || 'warden-godavari' // Default fallback
}

// Fast hostel-to-coordinator mapping (no database queries)
const getCoordinatorForHostel = (hostelId: string): string => {
  const coordinatorMapping: Record<string, string> = {
    'hostel-godavari': 'campus-coord-1',
    'hostel-sarayu': 'campus-coord-1',
    'hostel-ganga1': 'campus-coord-2', 
    'hostel-ganga2': 'campus-coord-2',
    'hostel-krishna': 'campus-coord-3',
    'hostel-bhramaputra1': 'campus-coord-4',
    'hostel-bhramaputra2': 'campus-coord-4',
    'hostel-narmada': 'campus-coord-3',
    'hostel-saraswathi': 'campus-coord-5',
    'hostel-civils-lt-girls': 'campus-coord-6',
    'hostel-benz-circle': 'campus-coord-7'
  }
  return coordinatorMapping[hostelId] || 'campus-coord-1' // Default fallback
}

// Helper functions for descriptions
const getCampusDescription = (code: string) => {
  const descriptions: Record<string, string> = {
    'MC': 'Main Campus', 'NC': 'North Campus', 'SC': 'South Campus',
    'EC': 'East Campus', 'WC': 'West Campus', 'GH': 'Girls Hostel',
    'BH': 'Boys Hostel', 'GC': 'General Campus'
  }
  return descriptions[code] || 'Unknown Campus'
}

const getIssueDescription = (code: string) => {
  const descriptions: Record<string, string> = {
    'PL': 'Plumbing', 'CP': 'Carpentry', 'EL': 'Electrical', 'CL': 'Cleaning',
    'PT': 'Painting', 'AC': 'AC/Heating', 'NW': 'Network', 'FR': 'Furniture',
    'SC': 'Security', 'GN': 'General'
  }
  return descriptions[code] || 'General Issue'
}

const getPriorityDescription = (code: string) => {
  const descriptions: Record<string, string> = { 'H': 'High Priority', 'M': 'Medium Priority', 'L': 'Low Priority' }
  return descriptions[code] || 'Medium Priority'
}

export function useComplaintSubmission() {
  const queryClient = useQueryClient()
  const { isOnline, saveOffline } = useOfflineSync()

  return useMutation({
    mutationFn: async (data: ComplaintSubmissionData) => {
      // Check if we're offline
      if (!isOnline) {
        const offlineId = await saveOffline(data)
        return {
          id: offlineId,
          complaint_number: offlineId,
          status: 'pending_sync',
          offline: true,
          numberBreakdown: {
            hostel_code: data.hostel_id.substring(0, 2).toUpperCase(),
            sequence: 'OFFLINE',
            year: new Date().getFullYear().toString().slice(-2)
          }
        }
      }

      // Show loading toast for network submission
      toast.loading('Creating complaint...', { id: 'complaint-submit' })

      // Generate simple complaint number (hostel prefix + serial)
      const { complaintNumber, metadata } = await generateSimpleComplaintNumber(data.hostel_id)

      // Validate field lengths to prevent database errors
      const validateLength = (value: string, maxLength: number, fieldName: string) => {
        if (value && value.length > maxLength) {
          throw new Error(`${fieldName} is too long (max ${maxLength} characters)`)
        }
        return value
      }

      // Prepare complaint data with instant IP detection
      const complaintData = {
        hostel_id: data.hostel_id.startsWith('fallback-') ? null : data.hostel_id,
        room_number: validateLength(data.room_text, 50, 'Room number'),
        category_id: data.category_id.startsWith('fallback-') ? null : data.category_id,
        student_name: validateLength(data.student_name, 100, 'Student name'),
        student_contact: data.student_contact ? validateLength(data.student_contact, 20, 'Contact') : 'Not provided',
        student_email: data.student_email ? validateLength(data.student_email, 100, 'Email') : null,
        student_id: data.student_id ? validateLength(data.student_id, 50, 'Student ID') : null,
        title: validateLength(data.title, 200, 'Title'),
        description: validateLength(data.description, 2000, 'Description'),
        urgency_level: data.urgency_level,
        complaint_number: validateLength(complaintNumber, 20, 'Complaint number'),
        status: COMPLAINT_WORKFLOW_STATUS.VERIFICATION_PENDING,
        priority: data.urgency_level,
        created_by_ip: getInstantIP(),
      }

      console.log('Simple complaint number generated:', {
        number: complaintNumber,
        breakdown: metadata
      })

      // Insert complaint and get result
      const { data: result, error } = await supabase
        .from('complaints')
        .insert([complaintData])
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      // Fast parallel auto-assignment (no sequential database calls)
      const wardenId = getWardenForHostel(data.hostel_id)
      const coordinatorId = getCoordinatorForHostel(data.hostel_id)

      // Batch all assignment operations in parallel
      const assignmentPromises = [
        // Create assignments
        supabase.from('complaint_assignments').insert([
          {
            complaint_id: result.id,
            staff_member_id: wardenId,
            assigned_by: 'admin-1',
            assignment_reason: 'Auto-assigned to hostel warden for verification',
            is_current: true,
            assignment_stage: 'VERIFICATION'
          },
          {
            complaint_id: result.id,
            staff_member_id: coordinatorId,
            assigned_by: 'admin-1',
            assignment_reason: 'Auto-assigned to campus coordinator for execution',
            is_current: true,
            assignment_stage: 'WORK_EXECUTION'
          }
        ]),
        // Create activity logs
        supabase.from('complaint_activities').insert([
          {
            complaint_id: result.id,
            activity_type: 'CREATED',
            description: `Complaint submitted via student kiosk by ${data.student_name} | ${metadata.description}`,
            performed_by: 'admin-1',
          },
          {
            complaint_id: result.id,
            activity_type: 'AUTO_ASSIGNED',
            description: 'Auto-assigned to warden and campus coordinator',
            performed_by: 'admin-1',
          }
        ])
      ]

      // Execute all operations in parallel for speed
      try {
        await Promise.all(assignmentPromises)
        console.log(`Fast auto-assignment completed for complaint ${result.id}`)
      } catch (assignmentError) {
        console.warn('Assignment failed but complaint created:', assignmentError)
        // Don't fail the entire submission if assignment fails
      }

      // Send push notifications for new complaint
      try {
        await ComplaintNotifications.onComplaintSubmitted({
          ...result,
          hostel: { name: data.hostel_id },
          room: { room_number: data.room_text },
          category: data.category_id
        })
        
        // Send urgent notification if high priority
        if (data.urgency_level >= 4) {
          await ComplaintNotifications.onUrgentComplaint({
            ...result,
            hostel: { name: data.hostel_id },
            room: { room_number: data.room_text },
            category: data.category_id
          })
        }
      } catch (notificationError) {
        console.warn('Notification sending failed:', notificationError)
        // Don't fail the submission if notifications fail
      }

      return { ...result, numberBreakdown: metadata }
    },
    onSuccess: (data) => {
      // Dismiss loading toast immediately
      toast.dismiss('complaint-submit')
      
      // Instant cache invalidation for immediate UI updates
      queryClient.invalidateQueries({ queryKey: queryKeys.complaints })
      
      // Success feedback with fast dismiss
      toast.success('Complaint Submitted Successfully!', {
        description: `ID: ${data.complaint_number} | Auto-assigned to staff`,
        duration: 4000,
      })
    },
    onError: (error: Error) => {
      // Dismiss loading toast immediately
      toast.dismiss('complaint-submit')
      
      console.error('Complaint submission error:', error)
      toast.error('Submission Failed', {
        description: error.message,
        duration: 6000,
      })
    },
  })
} 