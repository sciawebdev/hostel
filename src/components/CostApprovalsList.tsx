import { useState } from 'react'
import { DollarSign, CheckCircle, X, Clock, FileText, User, MapPin, Building, AlertTriangle, Star, Phone, Mail, Calendar, Shield, Wrench } from 'lucide-react'
import { useCostApproval, useWardenAuthentications, useComplaintActivities } from '../hooks/useRoleBasedWorkflow'
import { useAuth } from './AuthProvider'
import type { CostApproval } from '../types/auth'

// Simple date formatting function
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getUrgencyBadge = (urgency: number) => {
  if (urgency >= 4) return { text: 'High', class: 'bg-red-100 text-red-800' }
  if (urgency >= 3) return { text: 'Medium', class: 'bg-yellow-100 text-yellow-800' }
  return { text: 'Low', class: 'bg-green-100 text-green-800' }
}

interface CostApprovalsListProps {
  costApprovals: CostApproval[]
  isLoading: boolean
  onSelectApproval?: (approvalId: string) => void
}

interface ComplaintContextProps {
  approval: CostApproval
}

function ComplaintContext({ approval }: ComplaintContextProps) {
  const { data: wardenAuths = [] } = useWardenAuthentications(approval.complaint_id)
  const { data: activities = [] } = useComplaintActivities(approval.complaint_id)
  
  const complaint = approval.complaints
  if (!complaint) return null

  const urgencyBadge = getUrgencyBadge(complaint.urgency_level || 1)
  const latestWardenAuth = wardenAuths[0]
  const recentActivities = activities.slice(0, 5)

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-6">
      <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Complete Complaint Context</h4>
      
      {/* Original Complaint Details */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h5 className="font-medium text-gray-900 mb-3 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-blue-600" />
          Original Complaint
        </h5>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Complaint Number</p>
            <p className="text-sm text-gray-900">{complaint.complaint_number}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Status</p>
            <p className="text-sm text-gray-900">{complaint.status}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Campus/Hostel</p>
            <p className="text-sm text-gray-900">
              {complaint.hostels?.name || 'N/A'} 
              {complaint.hostels?.location && ` - ${complaint.hostels.location}`}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Room/Area</p>
            <p className="text-sm text-gray-900">
              {complaint.rooms ? `Room ${complaint.rooms.room_number}, Floor ${complaint.rooms.floor_number}` : 'Common Area'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Category</p>
            <p className="text-sm text-gray-900">{complaint.complaint_categories?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Urgency</p>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${urgencyBadge.class}`}>
              {urgencyBadge.text}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-600">Issue Title</p>
            <p className="text-sm text-gray-900">{complaint.title}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Description</p>
            <p className="text-sm text-gray-900">{complaint.description}</p>
          </div>
        </div>

        {/* Student Details */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h6 className="font-medium text-gray-900 mb-2 flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-600" />
            Student Information
          </h6>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-600">Name</p>
              <p className="text-gray-900">{complaint.student_name}</p>
            </div>
            <div>
              <p className="font-medium text-gray-600">Contact</p>
              <p className="text-gray-900">{complaint.student_contact}</p>
            </div>
            <div>
              <p className="font-medium text-gray-600">Student ID</p>
              <p className="text-gray-900">{complaint.student_id || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Warden Verification */}
      {latestWardenAuth && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h5 className="font-medium text-gray-900 mb-3 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-purple-600" />
            Warden Verification
          </h5>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Verified By</p>
              <p className="text-sm text-gray-900">{latestWardenAuth.warden?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Verification Status</p>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                latestWardenAuth.is_authenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {latestWardenAuth.is_authenticated ? 'Verified' : 'Rejected'}
              </span>
            </div>
          </div>
          
          {latestWardenAuth.authentication_notes && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Verification Notes</p>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{latestWardenAuth.authentication_notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Campus Coordinator Cost Estimation */}
      <div className="bg-white rounded-lg p-4 border border-green-200">
        <h5 className="font-medium text-gray-900 mb-3 flex items-center">
          <Wrench className="h-5 w-5 mr-2 text-green-600" />
          Campus Coordinator Cost Estimation
        </h5>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Estimated Cost</p>
            <p className="text-lg font-bold text-green-600">₹{approval.estimated_cost.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Estimated Time</p>
            <p className="text-sm text-gray-900">{approval.estimated_time_hours || 'N/A'} hours</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">External Vendor</p>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              approval.requires_external_vendor ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
            }`}>
              {approval.requires_external_vendor ? 'Required' : 'Not Required'}
            </span>
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">Estimated By</p>
          <p className="text-sm text-gray-900">{approval.estimated_by_user?.name || approval.estimated_by}</p>
        </div>
        
        {approval.estimation_notes && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-600 mb-1">Cost Breakdown & Notes</p>
            <div className="text-sm text-gray-900 bg-green-50 p-3 rounded border border-green-200">
              {approval.estimation_notes}
            </div>
          </div>
        )}
      </div>

      {/* Recent Activities */}
      {recentActivities.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h5 className="font-medium text-gray-900 mb-3 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            Recent Activity Timeline
          </h5>
          
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{formatDate(activity.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function CostApprovalsList({ costApprovals, isLoading }: CostApprovalsListProps) {
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null)
  const [expandedContext, setExpandedContext] = useState<string | null>(null)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [approvedCost, setApprovedCost] = useState('')
  const { user } = useAuth()
  const costApprovalMutation = useCostApproval()

  const handleApprove = async (approval: CostApproval) => {
    if (!user) return

    try {
      await costApprovalMutation.mutateAsync({
        complaintId: approval.complaint_id,
        approved: true,
        approvalNotes: approvalNotes || 'Cost estimate approved',
        approvedBy: user.id,
        approvedCost: approvedCost ? parseFloat(approvedCost) : approval.estimated_cost
      })
      setSelectedApproval(null)
      setApprovalNotes('')
      setApprovedCost('')
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleReject = async (approval: CostApproval) => {
    if (!user || !approvalNotes.trim()) {
      alert('Please provide rejection notes')
      return
    }

    try {
      await costApprovalMutation.mutateAsync({
        complaintId: approval.complaint_id,
        approved: false,
        approvalNotes,
        approvedBy: user.id
      })
      setSelectedApproval(null)
      setApprovalNotes('')
      setApprovedCost('')
    } catch (error) {
      // Error handled by mutation
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  const pendingApprovals = costApprovals.filter(ca => ca.status === 'PENDING_APPROVAL')

  if (pendingApprovals.length === 0) {
    return (
      <div className="bg-white p-12 rounded-lg shadow text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
        <p className="text-gray-600">No cost estimates pending approval at the moment.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Admin Cost Approval:</strong> Review complete complaint context and approve/reject cost estimates. Click "View Complete Context" to see original complaint, warden verification, and detailed cost breakdown.
        </p>
      </div>

      <div className="space-y-6">
        {pendingApprovals.map((approval) => (
          <div key={approval.id} className="bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Header with basic info */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-6 w-6 text-green-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Cost Estimate: ₹{approval.estimated_cost.toLocaleString()}
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Complaint: {approval.complaints?.title || approval.complaint_id}</p>
                      <p>Campus: {approval.complaints?.hostels?.name || 'N/A'}</p>
                      <p>Student: {approval.complaints?.student_name}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(approval.created_at)}</span>
                  </div>
                  {approval.complaints?.urgency_level && (
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      getUrgencyBadge(approval.complaints.urgency_level).class
                    }`}>
                      {getUrgencyBadge(approval.complaints.urgency_level).text} Priority
                    </span>
                  )}
                </div>
              </div>

              {/* Quick summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span>By: {approval.estimated_by_user?.name || approval.estimated_by}</span>
                </div>
                {approval.estimated_time_hours && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Time: {approval.estimated_time_hours} hours</span>
                  </div>
                )}
                {approval.requires_external_vendor && (
                  <div className="flex items-center space-x-2 text-orange-600">
                    <Building className="h-4 w-4" />
                    <span>Requires external vendor</span>
                  </div>
                )}
              </div>

              {/* Context toggle button */}
              <div className="mb-4">
                <button
                  onClick={() => setExpandedContext(expandedContext === approval.id ? null : approval.id)}
                  className="inline-flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>{expandedContext === approval.id ? 'Hide' : 'View'} Complete Context</span>
                </button>
              </div>

              {/* Expanded context */}
              {expandedContext === approval.id && (
                <ComplaintContext approval={approval} />
              )}

              {/* Approval/Rejection section */}
              {selectedApproval === approval.id ? (
                <div className="border-t pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Approved Cost (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={approvedCost}
                        onChange={(e) => setApprovedCost(e.target.value)}
                        placeholder={approval.estimated_cost.toString()}
                        className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty to approve original estimate</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Approval/Rejection Notes
                    </label>
                    <textarea
                      rows={3}
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="Add your approval or rejection notes..."
                      className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleApprove(approval)}
                      disabled={costApprovalMutation.isPending}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve</span>
                    </button>
                    
                    <button
                      onClick={() => handleReject(approval)}
                      disabled={costApprovalMutation.isPending || !approvalNotes.trim()}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <X className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedApproval(null)
                        setApprovalNotes('')
                        setApprovedCost('')
                      }}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t pt-4">
                  <button
                    onClick={() => setSelectedApproval(approval.id)}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>Review & Approve</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 