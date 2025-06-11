import { QueryClient } from '@tanstack/react-query'

// React Query configuration optimized for mobile
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Aggressive refetching for real-time data
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      
      // Optimize for mobile networks
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      
      // Retry configuration for unstable mobile connections
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status
          if (typeof status === 'number' && status >= 400 && status < 500) {
            return false
          }
        }
        // Retry up to 3 times for network errors
        return failureCount < 3
      },
      
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry mutations for better mobile experience
      retry: 1,
      retryDelay: 1000,
    },
  },
})

// React Query keys for the Hostel Management System
export const queryKeys = {
  // Hostels
  hostels: ['hostels'],
  hostel: (id: string) => ['hostels', id],
  
  // Rooms
  rooms: ['rooms'],
  roomsByHostel: (hostelId: string) => ['rooms', 'by-hostel', hostelId],
  roomsByFloor: (hostelId: string, floor: number) => ['rooms', 'by-floor', hostelId, floor],
  
  // Complaint Categories
  complaintCategories: ['complaint-categories'],
  complaintCategory: (id: string) => ['complaint-categories', id],
  
  // Complaints
  complaints: ['complaints'],
  complaint: (id: string) => ['complaints', id],
  complaintsByStatus: (status: string) => ['complaints', 'by-status', status],
  complaintsByHostel: (hostelId: string) => ['complaints', 'by-hostel', hostelId],
  complaintsByCategory: (categoryId: string) => ['complaints', 'by-category', categoryId],
  
  // Staff
  staffMembers: ['staff-members'],
  staffMember: (id: string) => ['staff-members', id],
  
  // Analytics
  complaintsStats: ['complaints-stats'],
  hostelStats: (hostelId: string) => ['hostel-stats', hostelId],
  
  // Activities
  complaintActivities: (complaintId: string) => ['complaint-activities', complaintId],
  recentActivities: ['recent-activities'],
} as const 