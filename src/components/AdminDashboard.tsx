import { useState } from 'react'
import { 
  BarChart3, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Building,
  Search,
  DollarSign,
  Bell
} from 'lucide-react'
import { ComplaintsList } from './index'
import { AdminComplaintManagement } from './index'
import { DashboardStats } from './index'
import { useComplaints } from '../hooks/useComplaints'
import { COMPLAINT_WORKFLOW_STATUS } from '../lib/supabase'
import { NotificationService } from '../lib/notificationService'
import { toast } from 'sonner'

type TabType = 'overview' | 'all' | 'pending' | 'cost-approval' | 'in-progress' | 'resolved'

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedHostel, setSelectedHostel] = useState<string>('')
  const [isLoadingTest, setIsLoadingTest] = useState(false)

  const { data: complaints = [], isLoading } = useComplaints()

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'all' as const, label: 'All Complaints', icon: Users },
    { id: 'pending' as const, label: 'Pending Verification', icon: AlertTriangle, color: 'text-orange-600' },
    { id: 'cost-approval' as const, label: 'Cost Approval', icon: DollarSign, color: 'text-purple-600' },
    { id: 'in-progress' as const, label: 'In Progress', icon: Clock, color: 'text-blue-600' },
    { id: 'resolved' as const, label: 'Resolved', icon: CheckCircle, color: 'text-green-600' },
  ]

  const getComplaintsByTab = (tab: TabType) => {
    if (tab === 'overview' || tab === 'all') return complaints
    return complaints.filter(complaint => {
      if (tab === 'pending') return complaint.status === COMPLAINT_WORKFLOW_STATUS.VERIFICATION_PENDING || complaint.status === COMPLAINT_WORKFLOW_STATUS.ASSIGNED_TO_CAMPUS_IC
      if (tab === 'cost-approval') return complaint.status === COMPLAINT_WORKFLOW_STATUS.PROPOSAL_SUBMITTED
      if (tab === 'in-progress') return complaint.status === COMPLAINT_WORKFLOW_STATUS.WORK_IN_PROGRESS || complaint.status === COMPLAINT_WORKFLOW_STATUS.WORK_DONE || complaint.status === COMPLAINT_WORKFLOW_STATUS.WORK_VERIFICATION_PENDING
      if (tab === 'resolved') return complaint.status === COMPLAINT_WORKFLOW_STATUS.RESOLVED || complaint.status === COMPLAINT_WORKFLOW_STATUS.CLOSED
      return false
    })
  }

  const handleTestNotification = async () => {
    try {
      await NotificationService.sendTestNotification()
      toast.success('Test notification sent! Check your device.')
    } catch (error) {
      console.error('Failed to send test notification:', error)
      toast.error('Failed to send test notification')
    }
  }

  const testFCMNotification = async () => {
    try {
      setIsLoadingTest(true)
      console.log('🧪 Testing FCM notification system...')
      
      // Test using static method
      await NotificationService.sendTestNotification()
      
      // Additional manual test with different scenarios
      console.log('📱 FCM Test completed - check device notifications and console')
      
      toast.success('FCM test notification sent! Check your device notification tray and console logs.')
      
    } catch (error) {
      console.error('❌ FCM test failed:', error)
      toast.error('FCM test failed. Check console for details.')
    } finally {
      setIsLoadingTest(false)
    }
  }

  const checkFCMStatus = async () => {
    try {
      console.log('🔍 FCM System Status Check:', {
        isCapacitorNative: typeof window !== 'undefined' && 'Capacitor' in window,
        notificationSupport: 'Notification' in window,
        timestamp: new Date().toISOString()
      })
      
      // Test if notifications are supported
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const permission = Notification.permission
        toast.info(`FCM Status Check: Notification permission is ${permission}`)
      } else {
        toast.warning('Notifications not supported in this browser')
      }
      
    } catch (error) {
      console.error('❌ FCM status check failed:', error)
      toast.error('Failed to check FCM status')
    }
  }

  const filteredComplaints = getComplaintsByTab(activeTab).filter(complaint => {
    const matchesSearch = !searchQuery || 
      complaint.complaint_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.student_name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesHostel = !selectedHostel || complaint.hostel_id === selectedHostel

    return matchesSearch && matchesHostel
  })

  if (selectedComplaintId) {
    return (
      <AdminComplaintManagement 
        complaintId={selectedComplaintId}
        onBack={() => setSelectedComplaintId(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between h-auto sm:h-16 space-y-2 sm:space-y-0 w-full">
            <div className="flex items-center space-x-4 w-full min-w-0">
              <Building className="h-8 w-8 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Hostel Management</h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-end min-w-0">
              <button
                onClick={handleTestNotification}
                className="flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Bell className="h-4 w-4" />
                <span>Test Notification</span>
              </button>
              <div className="relative w-full sm:w-auto">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search complaints..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm w-full sm:w-auto focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6 overflow-x-auto">
          <nav className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto scrollbar-thin scrollbar-thumb-blue-200">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              const count = getComplaintsByTab(tab.id).length
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm truncate max-w-[110px] sm:max-w-none
                    ${isActive 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className={`
                    -ml-0.5 mr-2 h-4 w-4 sm:h-5 sm:w-5
                    ${isActive ? 'text-blue-500' : tab.color || 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  <span className="truncate">{tab.label}</span>
                  {tab.id !== 'overview' && (
                    <span className={`
                      ml-2 py-0.5 px-2 rounded-full text-xs
                      ${isActive 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'overview' ? (
          <DashboardStats />
        ) : (
          <ComplaintsList 
            complaints={filteredComplaints}
            isLoading={isLoading}
            onSelectComplaint={setSelectedComplaintId}
            selectedHostel={selectedHostel}
            onHostelChange={setSelectedHostel}
          />
        )}

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={checkFCMStatus}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              📊 Check FCM Status
            </button>
            <button
              onClick={testFCMNotification}
              disabled={isLoadingTest}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isLoadingTest ? '⏳ Testing...' : '🔔 Test FCM Notification'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 