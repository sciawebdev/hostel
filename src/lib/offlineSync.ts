import { supabase } from './supabase'
import type { ComplaintSubmissionData } from '../hooks/useComplaintSubmission'
import { toast } from 'sonner'

// IndexedDB configuration for offline storage
const DB_NAME = 'hostel_management_offline'
const DB_VERSION = 1
const STORES = {
  PENDING_COMPLAINTS: 'pending_complaints',
  CACHED_DATA: 'cached_data',
  SYNC_QUEUE: 'sync_queue'
}

class OfflineSyncService {
  private db: IDBDatabase | null = null
  private isOnline: boolean = navigator.onLine
  private syncInProgress: boolean = false

  constructor() {
    this.initializeDB()
    this.setupEventListeners()
  }

  // Initialize IndexedDB
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create object stores
        if (!db.objectStoreNames.contains(STORES.PENDING_COMPLAINTS)) {
          const store = db.createObjectStore(STORES.PENDING_COMPLAINTS, { 
            keyPath: 'id', 
            autoIncrement: true 
          })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('status', 'status', { unique: false })
        }
        
        if (!db.objectStoreNames.contains(STORES.CACHED_DATA)) {
          const store = db.createObjectStore(STORES.CACHED_DATA, { keyPath: 'key' })
          store.createIndex('expiry', 'expiry', { unique: false })
        }
      }
    })
  }

  // Setup event listeners for online/offline status
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      toast.success('Back online! Syncing data...', { id: 'connection-status' })
      this.syncPendingData()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
      toast.error('You are offline. Data will be saved and synced when connected.', { 
        id: 'connection-status',
        duration: 5000 
      })
    })
  }

  // Check if we're online
  public isConnected(): boolean {
    return this.isOnline
  }

  // Store complaint submission for offline sync
  public async saveComplaintOffline(complaintData: ComplaintSubmissionData): Promise<string> {
    if (!this.db) await this.initializeDB()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.PENDING_COMPLAINTS], 'readwrite')
      const store = transaction.objectStore(STORES.PENDING_COMPLAINTS)
      
      const offlineComplaint = {
        ...complaintData,
        timestamp: Date.now(),
        status: 'pending_sync',
        offline_id: this.generateOfflineId()
      }
      
      const request = store.add(offlineComplaint)
      
      request.onsuccess = () => {
        resolve(offlineComplaint.offline_id)
        toast.success('Complaint saved offline. Will sync when connected.', {
          description: `Offline ID: ${offlineComplaint.offline_id}`
        })
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  // Sync pending complaints when online
  public async syncPendingData(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return
    
    this.syncInProgress = true
    
    try {
      const pendingComplaints = await this.getPendingComplaints()
      
      if (pendingComplaints.length === 0) {
        this.syncInProgress = false
        return
      }
      
      toast.loading(`Syncing ${pendingComplaints.length} offline complaints...`, {
        id: 'sync-progress'
      })
      
      let successCount = 0
      
      for (const complaint of pendingComplaints) {
        try {
          // Submit to Supabase
          const { error } = await supabase
            .from('complaints')
            .insert({
              hostel_id: complaint.hostel_id,
              room_id: complaint.room_id,
              room_text: complaint.room_text,
              student_name: complaint.student_name,
              student_roll_number: complaint.student_roll_number,
              student_contact: complaint.student_contact,
              category_id: complaint.category_id,
              description: complaint.description,
              urgency_level: complaint.urgency_level,
              photo_urls: complaint.photo_urls || [],
              status: 'VERIFICATION_PENDING'
            })
          
          if (error) throw error
          
          // Mark as synced
          await this.markComplaintSynced(complaint.id)
          successCount++
          
        } catch (error) {
          console.error('Failed to sync complaint:', error)
        }
      }
      
      toast.dismiss('sync-progress')
      
      if (successCount > 0) {
        toast.success(`Successfully synced ${successCount} complaints!`)
      }
      
    } catch (error) {
      console.error('Sync error:', error)
    } finally {
      this.syncInProgress = false
    }
  }

  // Get all pending complaints
  private async getPendingComplaints(): Promise<any[]> {
    if (!this.db) await this.initializeDB()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.PENDING_COMPLAINTS], 'readonly')
      const store = transaction.objectStore(STORES.PENDING_COMPLAINTS)
      const index = store.index('status')
      
      const request = index.getAll('pending_sync')
      
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Mark complaint as synced
  private async markComplaintSynced(id: number): Promise<void> {
    if (!this.db) await this.initializeDB()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.PENDING_COMPLAINTS], 'readwrite')
      const store = transaction.objectStore(STORES.PENDING_COMPLAINTS)
      
      const request = store.delete(id)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Generate offline ID
  private generateOfflineId(): string {
    return `OFFLINE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get sync status
  public async getSyncStatus(): Promise<{
    pendingCount: number
    isOnline: boolean
    lastSync: number | null
  }> {
    const pendingComplaints = await this.getPendingComplaints()
    const lastSync = localStorage.getItem('last_sync_timestamp')
    
    return {
      pendingCount: pendingComplaints.length,
      isOnline: this.isOnline,
      lastSync: lastSync ? parseInt(lastSync) : null
    }
  }

  // Force sync (manual trigger)
  public async forcSync(): Promise<void> {
    if (!this.isOnline) {
      toast.error('Cannot sync while offline')
      return
    }
    
    await this.syncPendingData()
  }
}

// Export singleton instance
export const offlineSync = new OfflineSyncService()

// Hook for React components
export function useOfflineSync() {
  return {
    isOnline: offlineSync.isConnected(),
    saveOffline: offlineSync.saveComplaintOffline.bind(offlineSync),
    sync: offlineSync.forcSync.bind(offlineSync),
    getSyncStatus: offlineSync.getSyncStatus.bind(offlineSync)
  }
}
