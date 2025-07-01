import { useState } from 'react'
import { ArrowLeft, DollarSign, CheckCircle } from 'lucide-react'
import { useComplaint } from '../hooks/useComplaints'
import { useAuth } from './AuthProvider'
import { 
  useCostEstimation,
  useWorkCompletion
} from '../hooks/useRoleBasedWorkflow'
import { ComplaintDetails } from './ComplaintDetails'
import { COMPLAINT_WORKFLOW_STATUS } from '../lib/supabase'

interface CampusInChargeComplaintManagementProps {
  complaintId: string
  onBack: () => void
}

export function CampusInChargeComplaintManagement({ complaintId, onBack }: CampusInChargeComplaintManagementProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'cost-estimate' | 'work-completion'>('details')
  
  // Cost estimation state
  const [estimatedCost, setEstimatedCost] = useState('')
  const [estimationNotes, setEstimationNotes] = useState('')
  const [estimatedTimeHours, setEstimatedTimeHours] = useState('')
  const [requiresExternalVendor, setRequiresExternalVendor] = useState(false)
  
  // Work completion state
  const [actualCost, setActualCost] = useState('')
  const [workNotes, setWorkNotes] = useState('')
  const [vendorDetails, setVendorDetails] = useState('')
  const [materialsUsed, setMaterialsUsed] = useState('')
  const [workDurationHours, setWorkDurationHours] = useState('')
  const [qualityRating, setQualityRating] = useState(5)

  const { user } = useAuth()
  const { data: complaint, isLoading } = useComplaint(complaintId)
  const costEstimationMutation = useCostEstimation()
  const workCompletionMutation = useWorkCompletion()

  const handleSubmitCostEstimate = async () => {
    if (!user || !estimatedCost) return

    try {
      await costEstimationMutation.mutateAsync({
        complaintId,
        estimatedCost: parseFloat(estimatedCost),
        estimationNotes,
        estimatedBy: user.id,
        estimatedTimeHours: estimatedTimeHours ? parseInt(estimatedTimeHours) : undefined,
        requiresExternalVendor
      })
      
      // Reset form
      setEstimatedCost('')
      setEstimationNotes('')
      setEstimatedTimeHours('')
      setRequiresExternalVendor(false)
      setActiveTab('details')
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleCompleteWork = async () => {
    if (!user || !actualCost || !workNotes) return

    try {
      await workCompletionMutation.mutateAsync({
        complaintId,
        actualCost: parseFloat(actualCost),
        workNotes,
        completedBy: user.id,
        vendorDetails: vendorDetails || undefined,
        materialsUsed: materialsUsed || undefined,
        workDurationHours: workDurationHours ? parseInt(workDurationHours) : undefined,
        qualityRating
      })
      
      // Reset form
      setActualCost('')
      setWorkNotes('')
      setVendorDetails('')
      setMaterialsUsed('')
      setWorkDurationHours('')
      setQualityRating(5)
      setActiveTab('details')
    } catch (error) {
      // Error handled by mutation
    }
  }

  if (isLoading || !complaint) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 p-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to dashboard
          </button>
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="bg-white p-6 rounded-lg shadow space-y-4">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const canEstimateCost = complaint.status === COMPLAINT_WORKFLOW_STATUS.ASSIGNED_TO_CAMPUS_IC || complaint.status === COMPLAINT_WORKFLOW_STATUS.COST_ESTIMATION_PENDING
  const canCompleteWork = complaint.status === COMPLAINT_WORKFLOW_STATUS.WORK_IN_PROGRESS

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto p-6">
        <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to dashboard
        </button>

        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Campus Coordinator Actions</h2>
            <p className="text-gray-600 mt-2">Complaint #{complaint.complaint_number} - Status: {complaint.status}</p>
            
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6 overflow-x-auto">
              <nav className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto scrollbar-thin scrollbar-thumb-blue-200">
                {[
                  { id: 'details', label: 'Complaint Details' },
                  { id: 'cost-estimate', label: 'Cost Estimate', disabled: !canEstimateCost },
                  { id: 'work-completion', label: 'Complete Work', disabled: !canCompleteWork }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
                    disabled={tab.disabled}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : tab.disabled
                        ? 'border-transparent text-gray-400 cursor-not-allowed'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'details' && (
              <ComplaintDetails complaintId={complaintId} onBack={() => {}} />
            )}

            {activeTab === 'cost-estimate' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  <DollarSign className="h-6 w-6 text-green-500" />
                  <h3 className="text-lg font-medium text-gray-900">Submit Cost Estimate</h3>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Automated Workflow:</strong> Once you submit the cost estimate, it will automatically be sent to the administrator for approval. After approval, the work will be automatically assigned back to you for execution.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Cost (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter estimated cost"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Time (Hours)
                    </label>
                    <input
                      type="number"
                      value={estimatedTimeHours}
                      onChange={(e) => setEstimatedTimeHours(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Expected hours to complete"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="external-vendor"
                    checked={requiresExternalVendor}
                    onChange={(e) => setRequiresExternalVendor(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="external-vendor" className="ml-2 block text-sm text-gray-900">
                    Requires external vendor/contractor
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimation Notes *
                  </label>
                  <textarea
                    rows={6}
                    value={estimationNotes}
                    onChange={(e) => setEstimationNotes(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Provide detailed breakdown of materials, labor, and other costs..."
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSubmitCostEstimate}
                    disabled={costEstimationMutation.isPending || !estimatedCost || !estimationNotes}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {costEstimationMutation.isPending ? 'Submitting...' : 'Submit Cost Estimate & Auto-Send for Approval'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'work-completion' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <h3 className="text-lg font-medium text-gray-900">Complete Work & Submit Final Report</h3>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>Automated Workflow:</strong> Once you submit the work completion details, it will automatically be sent to the administrator for final review and resolution.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Actual Cost (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={actualCost}
                      onChange={(e) => setActualCost(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter actual cost incurred"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Actual Duration (Hours)
                    </label>
                    <input
                      type="number"
                      value={workDurationHours}
                      onChange={(e) => setWorkDurationHours(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Actual hours spent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Details
                  </label>
                  <input
                    type="text"
                    value={vendorDetails}
                    onChange={(e) => setVendorDetails(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Name and contact of vendor/contractor (if applicable)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Materials Used
                  </label>
                  <textarea
                    rows={3}
                    value={materialsUsed}
                    onChange={(e) => setMaterialsUsed(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="List of materials and quantities used..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality Rating (1-5)
                  </label>
                  <select
                    value={qualityRating}
                    onChange={(e) => setQualityRating(parseInt(e.target.value))}
                    className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={5}>5 - Excellent</option>
                    <option value={4}>4 - Good</option>
                    <option value={3}>3 - Average</option>
                    <option value={2}>2 - Below Average</option>
                    <option value={1}>1 - Poor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Completion Notes *
                  </label>
                  <textarea
                    rows={6}
                    value={workNotes}
                    onChange={(e) => setWorkNotes(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the work completed, any challenges faced, student satisfaction, etc..."
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleCompleteWork}
                    disabled={workCompletionMutation.isPending || !actualCost || !workNotes}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {workCompletionMutation.isPending ? 'Submitting...' : 'Complete Work & Auto-Send for Final Review'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 