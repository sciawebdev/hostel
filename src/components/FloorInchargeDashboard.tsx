import { useState, useMemo } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye,
  LogOut,
  UserCheck,
  FileCheck
} from 'lucide-react'
import { useComplaints } from '../hooks/useComplaints'
import { useAuth } from './AuthProvider'
import { ComplaintsList } from './ComplaintsList'
import { FloorInchargeComplaintManagement } from './FloorInchargeComplaintManagement'
import { COMPLAINT_WORKFLOW_STATUS } from '../lib/supabase'
import type { Complaint } from '../lib/supabase'

type TabType = 'pending-verification' | 'work-verification' | 'all-complaints'

export function FloorInchargeDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('pending-verification')
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null)
  const { user, logout } = useAuth()
  const { data: complaints = [], isLoading } = useComplaints()

  const [selectedHostel, setSelectedHostel] = useState<string>(user?.hostel_id || 'all')

  // Filter complaints for this hostel if floor incharge is assigned to specific hostel
  const hostelComplaints = useMemo(() => {
    if (!user?.hostel_id) return complaints
    return complaints.filter((c: Complaint) => c.hostel_id === user.hostel_id)
  }, [complaints, user?.hostel_id])

  const stats = {
    pendingVerification: hostelComplaints.filter((c: Complaint) => c.status === COMPLAINT_WORKFLOW_STATUS.VERIFICATION_PENDING).length,
    workVerification: hostelComplaints.filter((c: Complaint) => c.status === COMPLAINT_WORKFLOW_STATUS.WORK_VERIFICATION_PENDING).length,
    totalComplaints: hostelComplaints.length,
  }

  const tabs = [
    { id: 'pending-verification' as const, label: 'Pending Verification', icon: AlertTriangle, count: stats.pendingVerification },
    { id: 'work-verification' as const, label: 'Work Verification', icon: UserCheck, count: stats.workVerification },
    { id: 'all-complaints' as const, label: 'All Complaints', icon: Eye, count: stats.totalComplaints },
  ]

  const getComplaintsByTab = (tab: TabType) => {
    switch (tab) {
      case 'pending-verification':
        return hostelComplaints.filter((c: Complaint) => c.status === COMPLAINT_WORKFLOW_STATUS.VERIFICATION_PENDING)
      case 'work-verification':
        return hostelComplaints.filter((c: Complaint) => c.status === COMPLAINT_WORKFLOW_STATUS.WORK_VERIFICATION_PENDING)
      case 'all-complaints':
        return hostelComplaints
      default:
        return []
    }
  }

  if (selectedComplaintId) {
    return (
      <FloorInchargeComplaintManagement 
        complaintId={selectedComplaintId}
        onBack={() => setSelectedComplaintId(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28">
      {/* Header */}
      <div className="bg-blue-600 shadow-sm relative z-[60]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between h-auto sm:h-16 space-y-2 sm:space-y-0 w-full">
            <div className="flex items-center space-x-4 w-full min-w-0">
              <Shield className="h-8 w-8 text-white flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-semibold text-white truncate max-w-[160px] sm:max-w-none">Floor Incharge Dashboard</h1>
                <p className="text-xs sm:text-sm text-blue-100 truncate max-w-[120px] sm:max-w-none">
                  {user?.hostels?.location ? user.hostels.location : 'All Hostels'}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-end min-w-0">
              <div className="text-right min-w-0">
                <p className="text-xs sm:text-sm font-medium text-white truncate max-w-[100px] sm:max-w-none">{user?.name}</p>
                <p className="text-xs text-blue-100 truncate">Floor Incharge</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm text-blue-100 hover:text-white hover:bg-blue-700 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Verification</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingVerification}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Work Verification</p>
                <p className="text-2xl font-bold text-gray-900">{stats.workVerification}</p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Complaints</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalComplaints}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6 overflow-x-auto">
          <nav className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto scrollbar-thin scrollbar-thumb-blue-200">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center py-2 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm
                    ${isActive 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                    truncate max-w-[120px] sm:max-w-none
                  `}
                >
                  <Icon className={`
                    -ml-0.5 mr-2 h-4 w-4 sm:h-5 sm:w-5
                    ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  {tab.label}
                  <span className={`
                    ml-2 py-0.5 px-2 rounded-full text-xs
                    ${isActive 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <ComplaintsList 
          complaints={getComplaintsByTab(activeTab)}
          isLoading={isLoading}
          onSelectComplaint={setSelectedComplaintId}
          onHostelChange={setSelectedHostel}
          selectedHostel={selectedHostel}
        />

        {/* Quick Action Buttons */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FileCheck className="h-6 w-6 text-blue-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Verify Complaint</p>
                <p className="text-sm text-gray-500">Authenticate complaint validity</p>
              </div>
            </button>
            
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <UserCheck className="h-6 w-6 text-green-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Verify Work Completion</p>
                <p className="text-sm text-gray-500">Confirm work has been completed</p>
              </div>
            </button>
          </div>
        </div>

        {/* Information Panel */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Your Role as Floor Incharge</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• <strong>Complaint Verification:</strong> Authenticate whether complaints are genuine when they arrive</p>
            <p>• <strong>Work Verification:</strong> Verify that work has been completed satisfactorily after campus coordinator marks it as done</p>
            <p>• <strong>Admin Assignment:</strong> After your verification, complaints are sent to admin for manual assignment to appropriate coordinators</p>
            <p>• <strong>Final Resolution:</strong> Your work verification helps administrators complete the complaint resolution process</p>
          </div>
        </div>
      </div>
    </div>
  )
} 