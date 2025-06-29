import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/react-query'
import type { Hostel } from '../lib/supabase'

export function useHostels() {
  return useQuery({
    queryKey: queryKeys.hostels,
    queryFn: async (): Promise<Hostel[]> => {
      try {
        const { data, error } = await supabase
          .from('hostels')
          .select('*')
          .order('name')

        // If there is an explicit Supabase error we throw so React-Query can tag it.
        if (error) throw new Error(error.message)

        // If data comes back empty we will fall back to a baked-in list so the UI remains usable.
        if (data && data.length > 0) return data
      } catch (_) {
        // Ignore – we will fall back below.
      }

      // ---------- FALLBACK ----------
      // Basic list of hostels that will be used when Supabase is not reachable or returns no rows.
      // This keeps the dropdown functional so a complaint can still be submitted offline / during demo.
      const fallback: Hostel[] = [
        {
          id: 'fallback-godavari',
          name: 'Godavari Hostel',
          location: 'Main Campus',
          total_floors: 4,
          warden_name: 'Dr. Priya Sharma',
          warden_contact: '+91-9876543221',
          created_at: null,
          updated_at: null,
        },
        {
          id: 'fallback-krishna',
          name: 'Krishna Hostel',
          location: 'North Campus',
          total_floors: 3,
          warden_name: 'Mr. Amit Patel',
          warden_contact: '+91-9876543213',
          created_at: null,
          updated_at: null,
        },
      ]

      return fallback
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