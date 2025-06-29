import React, { useState } from 'react'
import { ArrowLeft, Shield, CheckCircle, XCircle } from 'lucide-react'
import { useComplaint } from '../hooks/useComplaints'
import { useFloorInchargeVerification } from '../hooks/useRoleBasedWorkflow'
import { useAuth } from './AuthProvider'
import { ComplaintDetails } from './ComplaintDetails'
import { COMPLAINT_WORKFLOW_STATUS, supabase } from '../lib/supabase'
import { toast } from 'sonner'

interface FloorInchargeComplaintManagementProps {
  complaintId: string
  onBack: () => void
}

export function FloorInchargeComplaintManagement({ complaintId, onBack }: FloorInchargeComplaintManagementProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'verify' | 'work-verify'>('details')
  const [verificationNotes, setVerificationNotes] = useState('')
  const [workVerificationNotes, setWorkVerificationNotes] = useState('')
  const [studentSignatureObtained, setStudentSignatureObtained] = useState(false)
  const [workSatisfactory, setWorkSatisfactory] = useState('')
  const [hasFloorInchargeVerified, setHasFloorInchargeVerified] = useState(false)

  const { user } = useAuth()
  const { data: complaint, isLoading } = useComplaint(complaintId)
  const floorInchargeVerificationMutation = useFloorInchargeVerification()

  const handleComplaintVerification = async (verified: boolean) => {
    if (!user) return

    try {
      await floorInchargeVerificationMutation.mutateAsync({
        complaintId,
        verified,
        notes: verificationNotes,
        floorInchargeId: user.id
      })
      
      setVerificationNotes('')
      setActiveTab('details')
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleWorkVerification = async (verified: boolean) => {
    if (!user || !studentSignatureObtained) return

    try {
      // Update complaint status based on verification
      const newStatus = verified ? COMPLAINT_WORKFLOW_STATUS.WORK_VERIFIED : COMPLAINT_WORKFLOW_STATUS.WORK_IN_PROGRESS

      const { error: updateError } = await supabase
        .from('complaints')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', complaintId)

      if (updateError) throw updateError

      // Create floor incharge authentication record for work verification
      const verificationData = {
        student_signature_obtained: studentSignatureObtained,
        work_satisfactory: workSatisfactory === 'yes',
        additional_comments: workVerificationNotes.trim() || null
      }

      const { error: authError } = await supabase
        .from('floor_incharge_authentications')
        .insert([{
          complaint_id: complaintId,
          floor_incharge_id: user.id,
          is_authenticated: verified,
          authentication_notes: JSON.stringify(verificationData),
          authenticated_at: new Date().toISOString()
        }])

      if (authError) throw authError

      // Log activity
      await supabase.from('complaint_activities').insert([
        {
          complaint_id: complaintId,
          activity_type: verified ? 'WORK_VERIFIED' : 'WORK_REJECTED',
          description: verified 
            ? `Work verified by floor incharge: ${workVerificationNotes}`
            : `Work rejected by floor incharge: ${workVerificationNotes}`,
          performed_by: user.id,
        }
      ])

      // Work verification complete - admin will handle final resolution

      setWorkVerificationNotes('')
      setStudentSignatureObtained(false)
      setWorkSatisfactory('')
      setHasFloorInchargeVerified(true)
      setActiveTab('details')
      
      toast.success(
        verified ? 'Work Verified Successfully' : 'Work Rejected - Sent Back for Rework',
        {
          description: verified 
            ? 'Work verification complete. Sent to admin for final resolution.'
            : 'Work has been sent back to campus coordinator for improvement.',
          duration: 5000,
        }
      )
    } catch (error: any) {
      toast.error('Work Verification Failed', {
        description: error.message,
        duration: 5000,
      })
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
            </div>
          </div>
        </div>
      </div>
    )
  }

  const canVerifyComplaint = complaint.status === COMPLAINT_WORKFLOW_STATUS.VERIFICATION_PENDING
  const canVerifyWork = complaint.status === COMPLAINT_WORKFLOW_STATUS.WORK_VERIFICATION_PENDING && !hasFloorInchargeVerified

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
            <h2 className="text-2xl font-bold text-gray-900">Floor Incharge Verification</h2>
            <p className="text-gray-600 mt-2">Complaint #{complaint.complaint_number}</p>
            
            {/* Tab Navigation */}
            <div className="mt-4 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'details', label: 'Complaint Details' },
                  { id: 'verify', label: 'Verify Complaint', disabled: !canVerifyComplaint },
                  { id: 'work-verify', label: 'Verify Work Completion', disabled: !canVerifyWork }
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

            {activeTab === 'verify' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="h-6 w-6 text-blue-500" />
                  <h3 className="text-lg font-medium text-gray-900">Authenticate Complaint</h3>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>New Workflow:</strong> Once you verify this complaint, it will be sent to the admin for manual assignment to a campus coordinator. If you reject it, the complaint will be marked as rejected.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Notes
                  </label>
                  <textarea
                    rows={4}
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Provide details about the complaint authenticity, urgency, and any observations..."
                    required
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => handleComplaintVerification(true)}
                    disabled={floorInchargeVerificationMutation.isPending || !verificationNotes.trim()}
                    className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {floorInchargeVerificationMutation.isPending ? 'Verifying...' : 'Verify Complaint'}
                  </button>
                  <button
                    onClick={() => handleComplaintVerification(false)}
                    disabled={floorInchargeVerificationMutation.isPending || !verificationNotes.trim()}
                    className="flex items-center px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Complaint
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'work-verify' && !hasFloorInchargeVerified && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-blue-500" />
                  <h3 className="text-lg font-medium text-gray-900">Work Completion Verification</h3>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>🏠 Floor Incharge Role:</strong> Please verify if the work has been completed satisfactorily by checking with the student and inspecting the work area.
                  </p>
                </div>

                {/* Simple Status Display - NO DETAILS */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">📋 Verification Required</h4>
                  <p className="text-sm text-gray-600">
                    Campus Coordinator has reported that work has been completed for complaint <strong>#{complaint.complaint_number}</strong>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Please verify with the student and inspect the work area to confirm completion.
                  </p>
                </div>

                {/* Student Signature Checkbox */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="studentSignature"
                      checked={studentSignatureObtained}
                      onChange={(e) => setStudentSignatureObtained(e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="studentSignature" className="text-sm font-medium text-yellow-800">
                      ✍️ <strong>Student Signature Obtained:</strong> I confirm that the student has signed acknowledging that the work has been completed satisfactorily
                    </label>
                  </div>
                  <p className="text-xs text-yellow-700 mt-2 ml-7">
                    This signature confirms the student is satisfied with the work quality and completion.
                  </p>
                </div>

                {/* Work Satisfactory Question */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">🔍 Work Quality Verification</h4>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700 font-medium">Is the work completed satisfactorily?</p>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="workSatisfactory"
                          value="yes"
                          checked={workSatisfactory === 'yes'}
                          onChange={(e) => setWorkSatisfactory(e.target.value)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">✅ Yes, work is satisfactory</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="workSatisfactory"
                          value="no"
                          checked={workSatisfactory === 'no'}
                          onChange={(e) => setWorkSatisfactory(e.target.value)}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">❌ No, work needs improvement</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Optional Additional Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💬 Additional Comments (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={workVerificationNotes}
                    onChange={(e) => setWorkVerificationNotes(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any additional observations or recommendations..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Only add comments if you have specific observations to share.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleWorkVerification(true)}
                    disabled={!studentSignatureObtained || workSatisfactory !== 'yes'}
                    className="flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    ✅ Verify Work Complete
                  </button>
                  <button
                    onClick={() => handleWorkVerification(false)}
                    disabled={!studentSignatureObtained || workSatisfactory !== 'no'}
                    className="flex items-center px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    ❌ Send Back for Rework
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    ℹ️ <strong>Note:</strong> Your verification will be sent to administration for final processing. Work details and costs are handled separately by the admin team.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'work-verify' && hasFloorInchargeVerified && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <h3 className="text-lg font-medium text-gray-900">Work Verification Completed</h3>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-green-900 mb-2">✅ Verification Already Submitted</h4>
                  <p className="text-sm text-green-800 mb-4">
                    You have already verified the work completion for complaint <strong>#{complaint.complaint_number}</strong>
                  </p>
                  <div className="bg-white border border-green-200 rounded-lg p-4 text-left">
                    <p className="text-sm text-gray-600">
                      <strong>Status:</strong> Your verification has been submitted and is now being processed by the administration for final resolution.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      You cannot modify or resubmit verification for this complaint. If there are any issues, please contact the administration directly.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 