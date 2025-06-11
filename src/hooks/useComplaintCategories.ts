import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/react-query'
import type { ComplaintCategory } from '../lib/supabase'

export function useComplaintCategories() {
  return useQuery({
    queryKey: queryKeys.complaintCategories,
    queryFn: async (): Promise<ComplaintCategory[]> => {
      const { data, error } = await supabase
        .from('complaint_categories')
        .select('*')
        .order('priority_level', { ascending: false })
        .order('name')
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data || []
    },
  })
} 