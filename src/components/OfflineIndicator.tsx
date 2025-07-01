import { useState, useEffect } from 'react'
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw } from 'lucide-react'
import { useOfflineSync } from '../lib/offlineSync'
import { toast } from 'sonner'

export function OfflineIndicator() {
  const { isOnline, sync, getSyncStatus } = useOfflineSync()
  const [syncStatus, setSyncStatus] = useState({
    pendingCount: 0,
    isOnline: true,
    lastSync: null as number | null
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const updateSyncStatus = async () => {
      try {
        const status = await getSyncStatus()
        setSyncStatus(status)
      } catch (error) {
        console.error('Failed to get sync status:', error)
      }
    }

    updateSyncStatus()
    const interval = setInterval(updateSyncStatus, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [getSyncStatus])

  const handleManualSync = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline')
      return
    }

    setIsLoading(true)
    try {
      await sync()
      const updatedStatus = await getSyncStatus()
      setSyncStatus(updatedStatus)
      toast.success('Sync completed!')
    } catch (error) {
      toast.error('Sync failed')
      console.error('Manual sync failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Never'
    
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} min${minutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  if (!isOnline || syncStatus.pendingCount > 0) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <div className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium shadow-lg
          ${isOnline 
            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
          }
        `}>
          {isOnline ? (
            <Cloud className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          
          <span>
            {isOnline 
              ? `${syncStatus.pendingCount} pending sync${syncStatus.pendingCount !== 1 ? 's' : ''}`
              : 'Offline mode'
            }
          </span>
          
          {isOnline && syncStatus.pendingCount > 0 && (
            <button
              onClick={handleManualSync}
              disabled={isLoading}
              className="ml-1 p-1 hover:bg-amber-200 rounded transition-colors"
              title="Sync now"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
        
        {syncStatus.lastSync && (
          <div className="mt-1 text-xs text-gray-600 px-3">
            Last sync: {formatLastSync(syncStatus.lastSync)}
          </div>
        )}
      </div>
    )
  }

  // Show online indicator briefly when coming back online
  if (isOnline && syncStatus.pendingCount === 0) {
    return (
      <div className="fixed bottom-4 left-4 z-50 opacity-75">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium shadow-lg bg-green-100 text-green-800 border border-green-200">
          <Wifi className="w-4 h-4" />
          <span>Online & synced</span>
        </div>
      </div>
    )
  }

  return null
} 