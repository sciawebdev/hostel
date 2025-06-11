import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/react-query'
import type { StaffMember } from '../lib/supabase'

export function useStaffMembers() {
  return useQuery({
    queryKey: queryKeys.staffMembers,
    queryFn: async (): Promise<StaffMember[]> => {
      const { data, error } = await supabase
        .from('staff_members')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data || []
    },
  })
}

export function useStaffMember(id: string) {
  return useQuery({
    queryKey: queryKeys.staffMember(id),
    queryFn: async (): Promise<StaffMember | null> => {
      const { data, error } = await supabase
        .from('staff_members')
        .select('*')
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