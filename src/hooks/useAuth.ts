// This file has been merged into AuthProvider.tsx for simplicity
// Please import useAuth from AuthProvider.tsx instead 

// Custom hooks for accessing demo users and role-based functionality
import { getCampusInChargeUsers, getHostelWardens } from '../components/AuthProvider'
import { useState, useEffect, useContext, createContext } from 'react'
import { supabase, type Complaint } from '../lib/supabase'
import type { UserRole, Permission, CostApproval, WardenAuthentication, ComplaintAssignment, ComplaintActivity, WorkProgressUpdate } from '../types/auth'

// Hook to get campus in-charge users
export function useCampusInChargeUsers() {
  return {
    data: getCampusInChargeUsers(),
    isLoading: false,
    error: null
  }
}

// Hook to get hostel wardens
export function useHostelWardens(hostelId?: string) {
  return {
    data: getHostelWardens(hostelId),
    isLoading: false,
    error: null
  }
}

// Hook to get all users (for admin)
export function useUsers() {
  const campusUsers = getCampusInChargeUsers()
  const wardens = getHostelWardens()
  
  return {
    data: [...campusUsers, ...wardens],
    isLoading: false,
    error: null
  }
} 