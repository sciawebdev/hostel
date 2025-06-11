import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Building,
  Timer,
  BarChart3
} from 'lucide-react'
import { useComplaints } from '../hooks/useComplaints'
import { useHostels } from '../hooks/useHostels'
import { useCostApprovals } from '../hooks/useRoleBasedWorkflow'

export function DashboardStats() {
  const { data: complaints = [] } = useComplaints()
  const { data: hostels = [] } = useHostels()
  const { data: costApprovals = [] } = useCostApprovals()

  // Calculate statistics
  const totalComplaints = complaints.length
  const pendingComplaints = complaints.filter(c => c.status === 'PENDING' || c.status === 'OPEN').length
  const inProgressComplaints = complaints.filter(c => c.status === 'IN_PROGRESS').length
  const resolvedComplaints = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length
  
  const resolutionRate = totalComplaints > 0 ? (resolvedComplaints / totalComplaints) * 100 : 0
  const pendingCostApprovals = costApprovals.filter(ca => ca.status === 'PENDING_APPROVAL').length

  // Recent complaints (last 24 hours)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const recentComplaints = complaints.filter(c => 
    c.created_at && new Date(c.created_at) > yesterday
  ).length

  // Average resolution time (for resolved complaints)
  const resolvedComplaintsWithTimes = complaints.filter(c => 
    c.status === 'RESOLVED' && c.created_at && c.resolved_at
  )
  
  const avgResolutionHours = resolvedComplaintsWithTimes.length > 0 
    ? resolvedComplaintsWithTimes.reduce((sum, c) => {
        const created = new Date(c.created_at!).getTime()
        const resolved = new Date(c.resolved_at!).getTime()
        return sum + (resolved - created) / (1000 * 60 * 60) // hours
      }, 0) / resolvedComplaintsWithTimes.length
    : 0

  // Most common complaint categories
  const categoryStats = complaints.reduce((acc, complaint) => {
    if (complaint.complaint_categories?.name) {
      const category = complaint.complaint_categories.name
      acc[category] = (acc[category] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const topCategories = Object.entries(categoryStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)

  // Hostel with most complaints
  const hostelStats = complaints.reduce((acc, complaint) => {
    if (complaint.hostels?.name) {
      const hostel = complaint.hostels.name
      acc[hostel] = (acc[hostel] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const topHostel = Object.entries(hostelStats)
    .sort(([,a], [,b]) => b - a)[0]

  const stats = [
    {
      name: 'Total Complaints',
      value: totalComplaints,
      icon: AlertTriangle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      change: `+${recentComplaints} today`,
      changeType: recentComplaints > 0 ? 'increase' : 'neutral',
    },
    {
      name: 'Pending',
      value: pendingComplaints,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: `${((pendingComplaints / totalComplaints) * 100).toFixed(1)}% of total`,
      changeType: 'neutral',
    },
    {
      name: 'In Progress',
      value: inProgressComplaints,
      icon: Timer,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: `${((inProgressComplaints / totalComplaints) * 100).toFixed(1)}% of total`,
      changeType: 'neutral',
    },
    {
      name: 'Resolved',
      value: resolvedComplaints,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: `${resolutionRate.toFixed(1)}% resolution rate`,
      changeType: 'positive',
    },
    {
      name: 'Avg Resolution Time',
      value: `${avgResolutionHours.toFixed(1)}h`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: 'Based on resolved complaints',
      changeType: 'neutral',
    },
    {
      name: 'Active Hostels',
      value: hostels.length,
      icon: Building,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      change: 'Properties managed',
      changeType: 'neutral',
    },
  ]

  // Recent activity
  const recentComplaintsList = complaints
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`${stat.bgColor} p-3 rounded-md`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {stat.name}
                        </dt>
                        <dd className="text-lg font-semibold text-gray-900">
                          {stat.value}
                        </dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className={`
                      text-sm flex items-center
                      ${stat.changeType === 'positive' ? 'text-green-600' : 
                        stat.changeType === 'increase' ? 'text-red-600' : 'text-gray-500'}
                    `}>
                      {stat.change}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="h-6 w-6 text-blue-500" />
            <h3 className="text-lg font-medium text-gray-900">Complaint Status Distribution</h3>
          </div>
          
          <div className="space-y-3">
            {[
              { label: 'Resolved', count: resolvedComplaints, color: 'bg-green-500', textColor: 'text-green-700' },
              { label: 'In Progress', count: inProgressComplaints, color: 'bg-yellow-500', textColor: 'text-yellow-700' },
              { label: 'Pending', count: pendingComplaints, color: 'bg-orange-500', textColor: 'text-orange-700' },
            ].map((item) => {
              const percentage = totalComplaints > 0 ? Math.round((item.count / totalComplaints) * 100) : 0
              
              return (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-900">{item.count}</span>
                    <span className={`text-xs ${item.textColor} font-medium`}>({percentage}%)</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="h-6 w-6 text-blue-500" />
            <h3 className="text-lg font-medium text-gray-900">Recent Complaints</h3>
          </div>
          
          <div className="space-y-3">
            {recentComplaintsList.map((complaint) => (
              <div key={complaint.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{complaint.title}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">{complaint.student_name}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{complaint.hostels?.name}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${complaint.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                      complaint.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-orange-100 text-orange-800'
                    }
                  `}>
                    {complaint.status?.replace('_', ' ') || 'PENDING'}
                  </span>
                </div>
              </div>
            ))}
            
            {recentComplaintsList.length === 0 && (
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No complaints found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Complaint Categories */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Complaint Categories</h3>
          <div className="space-y-3">
            {topCategories.length > 0 ? (
              topCategories.map(([category, count], index) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`
                      w-3 h-3 rounded-full mr-3
                      ${index === 0 ? 'bg-red-500' : index === 1 ? 'bg-yellow-500' : 'bg-green-500'}
                    `} />
                    <span className="text-sm font-medium text-gray-900">{category}</span>
                  </div>
                  <span className="text-sm text-gray-500">{count} complaints</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No complaints yet</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
              <span className="text-gray-600">
                {recentComplaints} new complaints in the last 24 hours
              </span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
              <span className="text-gray-600">
                Resolution rate: {resolutionRate.toFixed(1)}%
              </span>
            </div>
            {topHostel && (
              <div className="flex items-center text-sm">
                <div className="w-3 h-3 rounded-full bg-orange-500 mr-3" />
                <span className="text-gray-600">
                  {topHostel[0]} has the most complaints ({topHostel[1]})
                </span>
              </div>
            )}
            <div className="flex items-center text-sm">
              <div className="w-3 h-3 rounded-full bg-purple-500 mr-3" />
              <span className="text-gray-600">
                Average resolution time: {avgResolutionHours.toFixed(1)} hours
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Approvals Summary */}
      {pendingCostApprovals > 0 && (
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Urgent Action Required</h3>
                <p className="text-sm text-gray-600">
                  {pendingCostApprovals} cost estimate{pendingCostApprovals > 1 ? 's' : ''} awaiting your approval
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                {pendingCostApprovals} Pending
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 