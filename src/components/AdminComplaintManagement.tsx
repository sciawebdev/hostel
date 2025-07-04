import { useState } from 'react'
import { 
  ArrowLeft,
  Clock,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  DollarSign,
  Settings,
  Eye,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  MessageCircle
} from 'lucide-react'
import { useComplaint } from '../hooks/useComplaints'
import { useAuth } from './AuthProvider'
import { 
  useCostApprovals,
  useFloorInchargeAuthentications,
  useCostApproval,
  useFinalResolution,
  useAssignComplaintToUser
} from '../hooks/useRoleBasedWorkflow'
import { getCampusInChargeUsers } from './AuthProvider'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { ComplaintDetails } from './ComplaintDetails'
import { COMPLAINT_WORKFLOW_STATUS } from '../lib/supabase'

interface AdminComplaintManagementProps {
  complaintId: string
  onBack: () => void
}

export function AdminComplaintManagement({ complaintId, onBack }: AdminComplaintManagementProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'assignment' | 'cost-approval' | 'final-resolution' | 'reopen'>('details')
  
  // Assignment state
  const [selectedCoordinator, setSelectedCoordinator] = useState('')
  const [assignmentReason, setAssignmentReason] = useState('')
  
  // Cost approval state
  const [approvalNotes, setApprovalNotes] = useState('')
  const [approvedCost, setApprovedCost] = useState('')
  
  // Final resolution state
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [satisfactionRating, setSatisfactionRating] = useState(5)
  const [lessonsLearned, setLessonsLearned] = useState('')

  // Reopen state
  const [reopenReason, setReopenReason] = useState('')
  const [isReopening, setIsReopening] = useState(false)

  const { user } = useAuth()
  const { data: complaint, isLoading } = useComplaint(complaintId)
  const { data: costApprovals = [] } = useCostApprovals(complaintId)
  const { data: floorInchargeAuthentications = [] } = useFloorInchargeAuthentications(complaintId)
  
  const costApprovalMutation = useCostApproval()
  const finalResolutionMutation = useFinalResolution()
  const assignmentMutation = useAssignComplaintToUser()
  
  const campusCoordinators = getCampusInChargeUsers()

  const handleAssignment = async () => {
    if (!user || !selectedCoordinator) return

    console.log('=== ADMIN ASSIGNMENT ATTEMPT ===')
    console.log('Current user object:', JSON.stringify(user, null, 2))
    console.log('user.id:', user.id)
    console.log('user.id type:', typeof user.id)
    console.log('selectedCoordinator:', selectedCoordinator)
    console.log('assignmentReason:', assignmentReason)

    try {
      console.log('🚀 Starting assignment mutation...')
      await assignmentMutation.mutateAsync({
        complaint_id: complaintId,
        staff_member_id: selectedCoordinator,
        assigned_by: user.id,
        assignment_reason: assignmentReason || undefined
      })
      
      console.log('✅ Assignment completed successfully')
      setSelectedCoordinator('')
      setAssignmentReason('')
      setActiveTab('details')
    } catch (error) {
      console.error('❌ Assignment failed:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      // Error handled by mutation
    }
  }

  const handleCostApproval = async (approved: boolean) => {
    if (!user) return

    try {
      await costApprovalMutation.mutateAsync({
        complaintId,
        approved,
        approvalNotes,
        approvedBy: user.id,
        approvedCost: approved && approvedCost ? parseFloat(approvedCost) : undefined
      })
      
      setApprovalNotes('')
      setApprovedCost('')
      setActiveTab('details')
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleFinalResolution = async () => {
    if (!user) return

    try {
      await finalResolutionMutation.mutateAsync({
        complaintId,
        resolutionNotes,
        resolvedBy: user.id,
        satisfactionRating,
        lessonsLearned: lessonsLearned || undefined
      })
      
      setResolutionNotes('')
      setSatisfactionRating(5)
      setLessonsLearned('')
      onBack()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleReopenComplaint = async () => {
    if (!user || !reopenReason.trim()) return

    setIsReopening(true)
    try {
      // Update complaint status back to pending work verification
      const { error: updateError } = await supabase
        .from('complaints')
        .update({ 
          status: COMPLAINT_WORKFLOW_STATUS.WORK_VERIFICATION_PENDING,
          updated_at: new Date().toISOString()
        })
        .eq('id', complaintId)

      if (updateError) throw updateError

      // Log activity
      await supabase.from('complaint_activities').insert([
        {
          complaint_id: complaintId,
          activity_type: 'REOPENED',
          description: `Complaint reopened by admin: ${reopenReason}`,
          performed_by: user.id,
        }
      ])

      setReopenReason('')
      setActiveTab('details')
      
      toast.success('Complaint Reopened Successfully', {
        description: 'Complaint has been reopened and sent back for work verification.',
        duration: 5000,
      })
    } catch (error: any) {
      toast.error('Failed to Reopen Complaint', {
        description: error.message,
        duration: 5000,
      })
    } finally {
      setIsReopening(false)
    }
  }



  const getStageIcon = (stage: string) => {
    switch (stage) {
      case COMPLAINT_WORKFLOW_STATUS.VERIFICATION_PENDING:
        return <UserCheck className="h-5 w-5 text-orange-500" />
      case COMPLAINT_WORKFLOW_STATUS.PENDING_ADMIN_ASSIGNMENT:
        return <Settings className="h-5 w-5 text-purple-500" />
      case COMPLAINT_WORKFLOW_STATUS.ASSIGNED_TO_CAMPUS_IC:
        return <UserCheck className="h-5 w-5 text-blue-500" />
      case COMPLAINT_WORKFLOW_STATUS.PROPOSAL_SUBMITTED:
        return <Eye className="h-5 w-5 text-blue-500" />
      case COMPLAINT_WORKFLOW_STATUS.WORK_IN_PROGRESS:
        return <Settings className="h-5 w-5 text-orange-500" />
      case COMPLAINT_WORKFLOW_STATUS.WORK_DONE:
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case COMPLAINT_WORKFLOW_STATUS.WORK_VERIFICATION_PENDING:
        return <UserCheck className="h-5 w-5 text-orange-500" />
      case COMPLAINT_WORKFLOW_STATUS.RESOLVED:
        return <CheckCircle className="h-5 w-5 text-green-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case COMPLAINT_WORKFLOW_STATUS.VERIFICATION_PENDING:
        return 'bg-orange-100 text-orange-800'
      case COMPLAINT_WORKFLOW_STATUS.PENDING_ADMIN_ASSIGNMENT:
        return 'bg-purple-100 text-purple-800'
      case COMPLAINT_WORKFLOW_STATUS.ASSIGNED_TO_CAMPUS_IC:
        return 'bg-blue-100 text-blue-800'
      case COMPLAINT_WORKFLOW_STATUS.PROPOSAL_SUBMITTED:
        return 'bg-blue-100 text-blue-800'
      case COMPLAINT_WORKFLOW_STATUS.WORK_IN_PROGRESS:
        return 'bg-orange-100 text-orange-800'
      case COMPLAINT_WORKFLOW_STATUS.WORK_DONE:
        return 'bg-green-100 text-green-800'
      case COMPLAINT_WORKFLOW_STATUS.WORK_VERIFICATION_PENDING:
        return 'bg-orange-100 text-orange-800'
      case COMPLAINT_WORKFLOW_STATUS.RESOLVED:
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="bg-white p-6 rounded-lg shadow space-y-4">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to dashboard
          </button>
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Complaint not found</h3>
            <p className="text-gray-500">The complaint you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    )
  }

  const canAssign = complaint.status !== COMPLAINT_WORKFLOW_STATUS.RESOLVED && complaint.status !== COMPLAINT_WORKFLOW_STATUS.CLOSED
  const canApproveCost = complaint.status === COMPLAINT_WORKFLOW_STATUS.PROPOSAL_SUBMITTED
  const canResolve = complaint.status === COMPLAINT_WORKFLOW_STATUS.WORK_VERIFIED
  const canReopen = complaint.status === COMPLAINT_WORKFLOW_STATUS.RESOLVED
  const pendingCostApproval = costApprovals.find(ca => ca.status === 'PENDING_APPROVAL')

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto p-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to dashboard
        </button>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Administrator Review</h2>
                <p className="text-gray-600 mt-2">Complaint #{complaint.complaint_number} - Status: {complaint.status}</p>
              </div>
              
              {/* Current Stage Indicator */}
              <div className="flex items-center space-x-3">
                {getStageIcon(complaint.status || '')}
                <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium truncate max-w-[140px] sm:max-w-none ${getStageColor(complaint.status || '')}`}>
                  {complaint.status?.replace(/_/g, ' ') || 'Unknown'}
                </span>
              </div>
            </div>
            
            {/* Tab Navigation */}
            <div className="mt-4 border-b border-gray-200 overflow-x-auto">
              <nav className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto scrollbar-thin scrollbar-thumb-blue-200">
                {[
                  { id: 'details', label: 'Complaint Details' },
                  { id: 'assignment', label: 'Assign/Reassign Coordinator', disabled: !canAssign },
                  { id: 'cost-approval', label: 'Cost Approval', disabled: !canApproveCost },
                  { id: 'final-resolution', label: 'Final Resolution', disabled: !canResolve },
                  { id: 'reopen', label: 'Reopen Complaint', disabled: !canReopen }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
                    disabled={tab.disabled}
                    className={`py-2 sm:py-3 px-1 border-b-2 font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : tab.disabled
                        ? 'border-transparent text-gray-400 cursor-not-allowed'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="truncate">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'details' && (
              <ComplaintDetails complaintId={complaintId} onBack={() => {}} />
            )}

            {activeTab === 'assignment' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Settings className="h-6 w-6 text-purple-500" />
                  <h3 className="text-lg font-medium text-gray-900">
                    {complaint.assigned_to ? 'Reassign to Campus Coordinator' : 'Assign to Campus Coordinator'}
                  </h3>
                </div>

                {/* Current Assignment Info */}
                {complaint.assigned_to && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Current Assignment</h4>
                    <p className="text-sm text-blue-800">
                      Currently assigned to: <strong>{(() => {
                        const currentCoordinator = campusCoordinators.find(c => c.id === complaint.assigned_to)
                        return currentCoordinator ? `${currentCoordinator.name} (${currentCoordinator.email})` : complaint.assigned_to
                      })()}</strong>
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Assigned on: {complaint.assigned_at ? new Date(complaint.assigned_at).toLocaleString() : 'Unknown'}
                    </p>
                  </div>
                )}

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-800">
                    <strong>{complaint.assigned_to ? 'Reassignment' : 'Assignment'} Process:</strong> Select a campus coordinator based on their expertise and availability. You can {complaint.assigned_to ? 'reassign to any coordinator' : 'choose any coordinator regardless of hostel assignment'} for flexibility.
                  </p>
                </div>

                {/* Complaint Summary */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    📋 Complaint Summary
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700">🏠 Hostel:</span>
                        <p className="text-sm text-gray-900">{complaint.hostels?.name || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-700">🔧 Category:</span>
                        <p className="text-sm text-gray-900">{complaint.complaint_categories?.name || 'General'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700">📊 Priority:</span>
                        <p className="text-sm text-gray-900">Level {complaint.complaint_categories?.priority_level || complaint.priority || 'Medium'}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-700">📅 Verified:</span>
                        <p className="text-sm text-gray-900">{complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : 'Recently'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-700">📝 Description:</span>
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-800">{complaint.description}</p>
                    </div>
                  </div>
                </div>

                {/* Campus Coordinator Selection */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    👥 Available Campus Coordinators
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Campus Coordinator *
                      </label>
                      <select
                        value={selectedCoordinator}
                        onChange={(e) => setSelectedCoordinator(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      >
                        <option value="">Choose a coordinator...</option>
                        {campusCoordinators.map((coordinator) => (
                          <option key={coordinator.id} value={coordinator.id}>
                            {coordinator.name} - {coordinator.contact}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selected Coordinator Details
                      </label>
                      {selectedCoordinator ? (
                        <div className="p-3 bg-purple-50 rounded-md space-y-2">
                          {(() => {
                            const coordinator = campusCoordinators.find(c => c.id === selectedCoordinator)
                            if (!coordinator) return null

                            const cleanPhone = coordinator.contact?.replace(/\D/g, '') || ''
                            const waNumber = cleanPhone.startsWith('91') || cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone}`
                            const waMessage = encodeURIComponent(
                              `Hi ${coordinator.name}, you have been assigned a new complaint (ID: ${complaint.complaint_number}).\n\n` +
                              `${complaint.description}\n\n` +
                              (assignmentReason ? `Admin Instructions: ${assignmentReason}` : '') +
                              `\n\nPlease review and proceed with cost estimation at your earliest convenience.`
                            )
                            const waLink = `https://wa.me/${waNumber}?text=${waMessage}`

                            return (
                              <div className="text-sm space-y-1">
                                <p className="font-medium text-purple-900">{coordinator.name}</p>
                                <p className="text-purple-700">📞 {coordinator.contact}</p>
                                <p className="text-purple-700">📧 {coordinator.email}</p>
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1.5 mt-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs"
                                >
                                  <MessageCircle className="h-4 w-4 mr-1" /> Open WhatsApp
                                </a>
                              </div>
                            )
                          })()}
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-500">Select a coordinator to see details</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assignment Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💬 Assignment Reason & Instructions (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={assignmentReason}
                    onChange={(e) => setAssignmentReason(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Specify why you selected this coordinator and any special instructions:&#10;• Expertise in this type of work&#10;• Current availability&#10;• Specific knowledge required&#10;• Any priority considerations"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This information will be shared with the assigned coordinator to provide context for the assignment.
                  </p>
                </div>

                {/* Assignment Actions */}
                <div className="flex space-x-4">
                  <button
                    onClick={handleAssignment}
                    disabled={assignmentMutation.isPending || !selectedCoordinator}
                    className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    {assignmentMutation.isPending 
                      ? (complaint.assigned_to ? 'Reassigning...' : 'Assigning...') 
                      : (complaint.assigned_to ? '🔄 Reassign to Coordinator' : '✅ Assign to Coordinator')
                    }
                  </button>
                  
                  {!selectedCoordinator && (
                    <div className="flex items-center px-4 py-3 bg-gray-100 text-gray-500 rounded-md text-sm">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Please select a coordinator first
                    </div>
                  )}
                </div>

                {selectedCoordinator && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      💡 Once {complaint.assigned_to ? 'reassigned' : 'assigned'}, the coordinator will receive the complaint for cost estimation and will proceed with the work after your approval.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'cost-approval' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  <DollarSign className="h-6 w-6 text-green-500" />
                  <h3 className="text-lg font-medium text-gray-900">Cost Estimate Review & Approval</h3>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Review Process:</strong> Please carefully review the cost estimate provided by the Campus In-Charge. You can approve as-is, modify the approved amount, provide suggestions, or reject for revision.
                  </p>
                </div>

                {/* Display cost estimate details */}
                {pendingCostApproval && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      📋 Cost Estimate Submission Details
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">💰 Estimated Cost:</span>
                          <p className="text-lg font-bold text-green-600">₹{pendingCostApproval.estimated_cost?.toLocaleString()}</p>
                        </div>
                        
                        <div>
                          <span className="text-sm font-medium text-gray-700">⏱️ Estimated Time:</span>
                          <p className="text-sm text-gray-900">{pendingCostApproval.estimated_time_hours || 'Not specified'} hours</p>
                        </div>
                        
                        <div>
                          <span className="text-sm font-medium text-gray-700">🏢 External Vendor Required:</span>
                          <p className={`text-sm font-medium ${pendingCostApproval.requires_external_vendor ? 'text-orange-600' : 'text-green-600'}`}>
                            {pendingCostApproval.requires_external_vendor ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-700">📅 Submitted:</span>
                        <p className="text-sm text-gray-900">{new Date(pendingCostApproval.created_at).toLocaleString()}</p>
                        
                        <span className="text-sm font-medium text-gray-700 mt-2 block">👤 Estimated By:</span>
                        <p className="text-sm text-gray-900">{pendingCostApproval.estimated_by_user?.name || 'Campus Coordinator'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-700">📝 Cost Breakdown & Methodology:</span>
                      <div className="mt-2 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{pendingCostApproval.estimation_notes || 'No detailed breakdown provided'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {!pendingCostApproval && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      ⚠️ No pending cost approval found for this complaint. The cost may have already been processed.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💵 Final Approved Cost (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={approvedCost}
                      onChange={(e) => setApprovedCost(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Original estimate: ₹${pendingCostApproval?.estimated_cost?.toLocaleString() || '0'}`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave blank to approve the original estimated amount. Enter a different amount to modify the approval.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📊 Cost Analysis
                    </label>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• Original Estimate: ₹{pendingCostApproval?.estimated_cost?.toLocaleString() || '0'}</p>
                      <p>• Your Approval: ₹{approvedCost ? parseFloat(approvedCost).toLocaleString() : 'Same as estimate'}</p>
                      {approvedCost && pendingCostApproval?.estimated_cost && (
                        <p className={`font-medium ${parseFloat(approvedCost) > pendingCostApproval.estimated_cost ? 'text-red-600' : parseFloat(approvedCost) < pendingCostApproval.estimated_cost ? 'text-green-600' : 'text-gray-600'}`}>
                          • Difference: {parseFloat(approvedCost) > pendingCostApproval.estimated_cost ? '+' : ''}₹{Math.abs(parseFloat(approvedCost) - pendingCostApproval.estimated_cost).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💬 Admin Review Comments & Decision Rationale *
                  </label>
                  <textarea
                    rows={6}
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Please provide detailed feedback on the cost estimate:&#10;• Your assessment of the proposed methodology&#10;• Suggestions for cost optimization&#10;• Approval rationale or reasons for rejection&#10;• Any specific instructions for the Campus Coordinator&#10;• Alternative approaches if applicable"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your comments will be shared with the Campus Coordinator to guide their work or revisions.
                  </p>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => handleCostApproval(true)}
                    disabled={costApprovalMutation.isPending || !approvalNotes.trim() || !pendingCostApproval}
                    className="flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    {costApprovalMutation.isPending ? 'Processing...' : '✅ Approve & Authorize Work'}
                  </button>
                  <button
                    onClick={() => handleCostApproval(false)}
                    disabled={costApprovalMutation.isPending || !approvalNotes.trim() || !pendingCostApproval}
                    className="flex items-center px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    ❌ Reject & Request Revision
                  </button>
                </div>

                {(!approvalNotes.trim() || !pendingCostApproval) && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                      💡 Please provide detailed review comments before making your decision. This helps maintain transparency and guides the Campus Coordinator.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'final-resolution' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <h3 className="text-lg font-medium text-gray-900">Final Resolution & Closure</h3>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>Work Completion Review:</strong> The campus coordinator has completed the work and submitted their final report. Please review and provide final resolution.
                  </p>
                </div>

                {/* Display work completion details */}
                {complaint.actual_cost && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <h4 className="font-medium text-gray-900">🏗️ Campus Coordinator Work Report:</h4>
                    <p className="text-sm text-gray-600">Actual Cost: ₹{complaint.actual_cost.toLocaleString()}</p>
                    {complaint.work_duration_hours && (
                      <p className="text-sm text-gray-600">Duration: {complaint.work_duration_hours} hours</p>
                    )}
                    {complaint.vendor_details && (
                      <p className="text-sm text-gray-600">Vendor: {complaint.vendor_details}</p>
                    )}
                    {complaint.materials_used && (
                      <p className="text-sm text-gray-600">Materials: {complaint.materials_used}</p>
                    )}
                    {complaint.quality_rating && (
                      <p className="text-sm text-gray-600">Quality Rating: {complaint.quality_rating}/5</p>
                    )}
                    {complaint.work_completion_notes && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Completion Notes:</span>
                        <p className="text-sm text-gray-600 ml-2 mt-1">{complaint.work_completion_notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Display Floor Incharge Verification Details */}
                {floorInchargeAuthentications.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                    <h4 className="font-medium text-gray-900">🏠 Floor Incharge Quality Verification:</h4>
                    {floorInchargeAuthentications.slice().reverse().map((auth: any, index: number) => {
                      // Chronological labelling: oldest = Verification 1
                      const displayIndex = index + 1;
                      let verificationData = null;
                      try {
                        verificationData = JSON.parse(auth.authentication_notes || '{}');
                      } catch (e) {
                        verificationData = { additional_comments: auth.authentication_notes };
                      }

                      return (
                        <div key={auth.id} className="bg-white border border-blue-200 rounded-md p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-800">
                              Verification {displayIndex} - {auth.authenticated_at ? new Date(auth.authenticated_at).toLocaleString() : 'N/A'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              auth.is_authenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {auth.is_authenticated ? '✅ Verified' : '❌ Rejected'}
                            </span>
                          </div>

                          <div className="space-y-2 text-sm">
                            {verificationData.student_signature_obtained !== undefined && (
                              <p className="text-gray-600">
                                <span className="font-medium">Student Signature:</span>{' '}
                                {verificationData.student_signature_obtained ? '✅ Obtained' : '❌ Not Obtained'}
                              </p>
                            )}
                            {verificationData.work_satisfactory !== undefined && (
                              <p className="text-gray-600">
                                <span className="font-medium">Work Quality:</span>{' '}
                                {verificationData.work_satisfactory ? '✅ Satisfactory' : '❌ Needs Improvement'}
                              </p>
                            )}
                            {verificationData.additional_comments && (
                              <div>
                                <span className="font-medium text-gray-700">Floor Incharge Comments:</span>
                                <p className="text-gray-600 ml-2 mt-1 italic">"{verificationData.additional_comments}"</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Satisfaction Rating (1-5)
                  </label>
                  <select
                    value={satisfactionRating}
                    onChange={(e) => setSatisfactionRating(parseInt(e.target.value))}
                    className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={5}>5 - Excellent Resolution</option>
                    <option value={4}>4 - Good Resolution</option>
                    <option value={3}>3 - Satisfactory Resolution</option>
                    <option value={2}>2 - Below Expectations</option>
                    <option value={1}>1 - Poor Resolution</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lessons Learned (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={lessonsLearned}
                    onChange={(e) => setLessonsLearned(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any insights for future similar complaints..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Final Resolution Notes *
                  </label>
                  <textarea
                    rows={6}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Provide final resolution summary, overall assessment, and closure notes..."
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleFinalResolution}
                    disabled={finalResolutionMutation.isPending || !resolutionNotes.trim()}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {finalResolutionMutation.isPending ? 'Resolving...' : 'Mark as Resolved & Close Complaint'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'reopen' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  <RotateCcw className="h-6 w-6 text-orange-500" />
                  <h3 className="text-lg font-medium text-gray-900">Reopen Resolved Complaint</h3>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-800">
                    <strong>⚠️ Reopen Policy:</strong> This complaint has been marked as resolved. Only reopen if there are legitimate issues with the work quality, incomplete resolution, or new problems related to the original issue.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">📋 Current Resolution Status</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Resolved Date:</span>
                      <p className="text-gray-600">{complaint.resolved_at ? new Date(complaint.resolved_at).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Resolved By:</span>
                      <p className="text-gray-600">{complaint.resolved_by || 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">Resolution Notes:</span>
                      <p className="text-gray-600 mt-1">{complaint.resolution_notes || 'No resolution notes available'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🔍 Reason for Reopening *
                  </label>
                  <textarea
                    rows={6}
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Please provide detailed justification for reopening this complaint:&#10;• What specific issues were found with the resolution?&#10;• Are there new problems related to the original issue?&#10;• What additional work or verification is needed?&#10;• Student feedback or quality concerns&#10;• Safety or compliance issues identified"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your reason will be logged and shared with all stakeholders to ensure accountability.
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">⚡ What happens after reopening:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Complaint status will be changed to "Work Verification Pending"</li>
                    <li>• Warden will be notified to re-verify the work</li>
                    <li>• Campus Coordinator may need to perform additional work</li>
                    <li>• All stakeholders will receive reopening notification</li>
                    <li>• This action will be permanently logged in the system</li>
                  </ul>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={handleReopenComplaint}
                    disabled={isReopening || !reopenReason.trim()}
                    className="flex items-center px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {isReopening ? 'Reopening...' : '🔄 Reopen Complaint'}
                  </button>
                  <button
                    onClick={() => setActiveTab('details')}
                    className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>

                {!reopenReason.trim() && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                      💡 Please provide a detailed reason for reopening to maintain transparency and accountability.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 