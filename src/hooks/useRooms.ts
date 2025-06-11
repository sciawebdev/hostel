import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/react-query'
import type { Room } from '../lib/supabase'

export function useRoomsByHostel(hostelId: string) {
  return useQuery({
    queryKey: queryKeys.roomsByHostel(hostelId),
    queryFn: async (): Promise<Room[]> => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('hostel_id', hostelId)
        .order('floor_number', { ascending: true })
        .order('room_number', { ascending: true })
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data || []
    },
    enabled: !!hostelId,
  })
}

export function useRoomsByFloor(hostelId: string, floorNumber: number) {
  return useQuery({
    queryKey: queryKeys.roomsByFloor(hostelId, floorNumber),
    queryFn: async (): Promise<Room[]> => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('hostel_id', hostelId)
        .eq('floor_number', floorNumber)
        .order('room_number', { ascending: true })
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data || []
    },
    enabled: !!hostelId && floorNumber !== undefined,
  })
}

export const useRoom = (id: string) => {
  return useQuery({
    queryKey: [...queryKeys.rooms, id],
    queryFn: async (): Promise<Room | null> => {
      const { data, error } = await supabase
        .from('rooms')
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
