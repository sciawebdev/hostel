import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/react-query'
import type { ComplaintCategory } from '../lib/supabase'

export function useComplaintCategories() {
  return useQuery({
    queryKey: queryKeys.complaintCategories,
    queryFn: async (): Promise<ComplaintCategory[]> => {
      try {
        const { data, error } = await supabase
          .from('complaint_categories')
          .select('*')
          .order('priority_level', { ascending: false })
          .order('name')
        
        if (error) throw new Error(error.message)
        if (data && data.length > 0) return data
      } catch (_) {
        // swallow – will use fallback
      }

      // ---------- FALLBACK ----------
      const fallback: ComplaintCategory[] = [
        {
          id: 'fallback-electric',
          name: 'Electrical',
          description: 'Issues with lights, fans, switches, wiring',
          icon: '💡',
          priority_level: 3,
          estimated_resolution_hours: 48,
          created_at: null,
        },
        {
          id: 'fallback-plumbing',
          name: 'Plumbing',
          description: 'Leaks, blocks, taps, commodes',
          icon: '🚰',
          priority_level: 2,
          estimated_resolution_hours: 72,
          created_at: null,
        },
        {
          id: 'fallback-cleaning',
          name: 'Cleaning',
          description: 'Room / bathroom cleaning, pest control',
          icon: '🧹',
          priority_level: 1,
          estimated_resolution_hours: 24,
          created_at: null,
        },
      ]

      return fallback
    },
  })
} 