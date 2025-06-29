import { useState, useMemo } from 'react'
import { BarChart3, Users, CheckCircle, Clock, Building, DollarSign, LogOut } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { useComplaints } from '../hooks/useComplaints'
import { useComplaintAssignmentsByStaff } from '../hooks/useRoleBasedWorkflow'
import { ComplaintsList } from './ComplaintsList'
import { CampusInChargeComplaintManagement } from './CampusInChargeComplaintManagement'

type Tab = 'assigned' | 'cost-estimation' | 'in-progress' | 'completed'

export function CampusInChargeDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('assigned')
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null)
  const [selectedHostel, setSelectedHostel] = useState<string>('all')

  const { user, logout } = useAuth()
  const { data: allComplaints, isLoading } = useComplaints()
  const { data: assignments } = useComplaintAssignmentsByStaff(user?.id)

  const complaints = useMemo(() => {
    if (!allComplaints || !assignments) return []
    const assignedComplaintIds = new Set(assignments.map(a => a.complaint_id))
    return allComplaints.filter(c => assignedComplaintIds.has(c.id))
  }, [allComplaints, assignments])

  const filteredComplaints = useMemo(() => {
    // Further filter by hostel if needed
    return selectedHostel === 'all' 
      ? complaints 
      : complaints.filter(c => c.hostel_id === selectedHostel)
  }, [complaints, selectedHostel])

  const stats = useMemo(() => ({
    assigned: complaints.filter(c => c.status === 'ASSIGNED_TO_CAMPUS_IC').length,
    costEstimation: complaints.filter(c => c.status === 'COST_ESTIMATION_PENDING').length,
    inProgress: complaints.filter(c => c.status === 'WORK_IN_PROGRESS').length,
    completed: complaints.filter(c => c.status === 'WORK_COMPLETED').length
  }), [complaints])

  const tabs = [
     { id: 'assigned' as const, label: 'Assigned to Me', icon: Users, count: stats.assigned },
      { id: 'cost-estimation' as const, label: 'Cost Estimation', icon: DollarSign, count: stats.costEstimation },
      { id: 'in-progress' as const, label: 'In Progress', icon: Clock, count: stats.inProgress },
      { id: 'completed' as const, label: 'Completed', icon: CheckCircle, count: stats.completed }
  ]

  if (selectedComplaintId) {
    return (
      <CampusInChargeComplaintManagement
        complaintId={selectedComplaintId}
        onBack={() => setSelectedComplaintId(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-28">
      {/* Header */}
      <div className="bg-white shadow-sm relative z-[60]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Campus In-Charge Dashboard</h1>
                <p className="text-sm text-gray-500">Managing complaints for your area</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">Campus In-Charge</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
            </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned to Me</p>
                <p className="text-2xl font-bold text-gray-900">{stats.assigned}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cost Estimation</p>
                <p className="text-2xl font-bold text-gray-900">{stats.costEstimation}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
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
        <div className="mt-8">
          <ComplaintsList
            complaints={filteredComplaints}
            isLoading={isLoading}
            onSelectComplaint={setSelectedComplaintId}
            selectedHostel={selectedHostel}
            onHostelChange={setSelectedHostel}
          />
        </div>

        {/* Quick Action Buttons */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <DollarSign className="h-6 w-6 text-blue-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Submit Cost Estimate</p>
                <p className="text-sm text-gray-500">Provide detailed cost breakdown</p>
              </div>
            </button>
            
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Building className="h-6 w-6 text-green-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Update Progress</p>
                <p className="text-sm text-gray-500">Add photos and progress notes</p>
              </div>
            </button>
            
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <CheckCircle className="h-6 w-6 text-purple-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Mark Complete</p>
                <p className="text-sm text-gray-500">Submit final bills and notes</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 