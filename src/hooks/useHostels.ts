import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/react-query'
import type { Hostel } from '../lib/supabase'

export function useHostels() {
  return useQuery({
    queryKey: queryKeys.hostels,
    queryFn: async (): Promise<Hostel[]> => {
      const { data, error } = await supabase
        .from('hostels')
        .select('*')
        .order('name')
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data || []
    },
  })
}

export function useHostel(id: string) {
  return useQuery({
    queryKey: queryKeys.hostel(id),
    queryFn: async (): Promise<Hostel | null> => {
      const { data, error } = await supabase
        .from('hostels')
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