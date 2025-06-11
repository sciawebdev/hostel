import { useState } from 'react'
import { 
  BarChart3, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Building,
  Search,
  DollarSign
} from 'lucide-react'
import { ComplaintsList } from './index'
import { AdminComplaintManagement } from './index'
import { DashboardStats } from './index'
import { useComplaints } from '../hooks/useComplaints'
import { COMPLAINT_WORKFLOW_STATUS } from '../lib/supabase'

type TabType = 'overview' | 'all' | 'pending' | 'cost-approval' | 'in-progress' | 'resolved'

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedHostel, setSelectedHostel] = useState<string>('')

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
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Hostel Management</h1>
                <p className="text-sm text-gray-500">Admin Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search complaints..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              const count = getComplaintsByTab(tab.id).length
              
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
                    ${isActive ? 'text-blue-500' : tab.color || 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  {tab.label}
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
      </div>
    </div>
  )
} 