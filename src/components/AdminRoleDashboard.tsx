import { useState, useMemo } from 'react'
import { 
  BarChart3, 
  Users, 
  CheckCircle, 
  Building,
  DollarSign,
  TrendingUp,
  LogOut,
  Shield
} from 'lucide-react'
import { useAuth } from './AuthProvider'
import { useComplaints } from '../hooks/useComplaints'
import { useCostApprovals } from '../hooks/useRoleBasedWorkflow'
import { COMPLAINT_WORKFLOW_STATUS } from '../lib/supabase'
import { ComplaintsList } from './ComplaintsList'
import { AdminComplaintManagement } from './AdminComplaintManagement'
import { DashboardStats } from './DashboardStats'

type TabType = 'overview' | 'all-complaints' | 'cost-approvals' | 'pending-resolution' | 'analytics'

export function AdminRoleDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null)
  const [selectedHostel, setSelectedHostel] = useState<string>('all')
  const { user, logout } = useAuth()
  const { data: complaints = [], isLoading } = useComplaints()
  const { data: costApprovals = [] } = useCostApprovals()

  const filteredComplaints = useMemo(() => {
    let filtered = complaints
    if (selectedHostel !== 'all') {
      filtered = filtered.filter(c => c.hostel_id === selectedHostel)
    }

    switch (activeTab) {
      case 'all-complaints':
        return filtered
      case 'cost-approvals':
        return filtered.filter(c => c.status === 'PROPOSAL_SUBMITTED')
      case 'pending-resolution':
        return filtered.filter(c => c.status === COMPLAINT_WORKFLOW_STATUS.WORK_VERIFICATION_PENDING || c.status === COMPLAINT_WORKFLOW_STATUS.WORK_VERIFIED)
      default:
        return []
    }
  }, [complaints, selectedHostel, activeTab])

  // Statistics for administrator view
  const stats = {
    totalComplaints: complaints.length,
    pendingComplaints: complaints.filter(c => c.status === COMPLAINT_WORKFLOW_STATUS.VERIFICATION_PENDING || c.status === COMPLAINT_WORKFLOW_STATUS.ASSIGNED_TO_CAMPUS_IC).length,
    inProgressComplaints: complaints.filter(c => c.status === COMPLAINT_WORKFLOW_STATUS.WORK_IN_PROGRESS || c.status === COMPLAINT_WORKFLOW_STATUS.WORK_DONE).length,
    resolvedComplaints: complaints.filter(c => c.status === COMPLAINT_WORKFLOW_STATUS.RESOLVED).length,
    pendingCostApprovals: costApprovals.filter(ca => ca.status === 'PENDING_APPROVAL').length,
    awaitingFinalApproval: complaints.filter(c => c.status === COMPLAINT_WORKFLOW_STATUS.WORK_VERIFICATION_PENDING || c.status === COMPLAINT_WORKFLOW_STATUS.WORK_VERIFIED).length,
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'all-complaints' as const, label: 'All Complaints', icon: Users, count: stats.totalComplaints },
    { id: 'cost-approvals' as const, label: 'Cost Approvals', icon: DollarSign, count: stats.pendingCostApprovals },
    { id: 'pending-resolution' as const, label: 'Awaiting Resolution', icon: CheckCircle, count: stats.awaitingFinalApproval },
    { id: 'analytics' as const, label: 'Analytics', icon: TrendingUp },
  ]

  if (selectedComplaintId) {
    return (
      <AdminComplaintManagement 
        complaintId={selectedComplaintId}
        onBack={() => setSelectedComplaintId(null)}
      />
    )
  }

  const renderContent = () => {
    if (activeTab === 'overview') {
      return <DashboardStats />
    }
    if (activeTab === 'analytics') {
      return (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Analytics</h3>
          <p className="text-gray-600">Advanced analytics and reporting features coming soon...</p>
        </div>
      )
    }
    return (
      <ComplaintsList
        complaints={filteredComplaints}
        isLoading={isLoading}
        onSelectComplaint={setSelectedComplaintId}
        onHostelChange={setSelectedHostel}
        selectedHostel={selectedHostel}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-white" />
              <div>
                <h1 className="text-xl font-semibold text-white">Administrator Dashboard</h1>
                <p className="text-sm text-blue-100">Welcome back, {user?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-blue-100">{user?.user_roles?.name.replace('_', ' ').toUpperCase()}</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-100 hover:text-white hover:bg-blue-700 rounded-md transition-colors"
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
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Complaints</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalComplaints}</p>
              </div>
              <Building className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingCostApprovals}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Awaiting Resolution</p>
                <p className="text-2xl font-bold text-gray-900">{stats.awaitingFinalApproval}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalComplaints > 0 ? Math.round((stats.resolvedComplaints / stats.totalComplaints) * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${isActive 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`
                      ml-2 py-0.5 px-2 rounded-full text-xs
                      ${isActive 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="mt-6">
          {renderContent()}
        </div>
      </div>
    </div>
  )
} 