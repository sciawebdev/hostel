import { useState } from 'react'
import { 
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  FileText,
  Edit3,
  Save,
  X
} from 'lucide-react'
import { useComplaint, useUpdateComplaintStatus, useAssignComplaint } from '../hooks/useComplaints'
import { useCampusInChargeUsers } from '../hooks/useAuth'
import { toast } from 'sonner'

interface ComplaintDetailsProps {
  complaintId: string
  onBack: () => void
}

export function ComplaintDetails({ complaintId, onBack }: ComplaintDetailsProps) {
  const { data: complaint, isLoading } = useComplaint(complaintId)
  const { data: campusCoordinators = [] } = useCampusInChargeUsers()
  const updateStatusMutation = useUpdateComplaintStatus()
  const assignMutation = useAssignComplaint()

  const [showStatusUpdate, setShowStatusUpdate] = useState(false)
  const [showAssignment, setShowAssignment] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [selectedStaff, setSelectedStaff] = useState('')
  const [estimatedResolution, setEstimatedResolution] = useState('')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to complaints
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'OPEN':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'RESOLVED':
      case 'CLOSED':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'OPEN':
        return 'bg-orange-100 text-orange-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleStatusUpdate = async () => {
    if (!newStatus) {
      toast.error('Please select a status')
      return
    }

    try {
      await updateStatusMutation.mutateAsync({
        id: complaint.id,
        status: newStatus,
        notes: resolutionNotes || undefined
      })
      setShowStatusUpdate(false)
      setNewStatus('')
      setResolutionNotes('')
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleAssignment = async () => {
    if (!selectedStaff) {
      toast.error('Please select a campus coordinator')
      return
    }

    const staff = campusCoordinators.find(s => s.id === selectedStaff)
    if (!staff) {
      toast.error('Selected campus coordinator not found')
      return
    }

    try {
      await assignMutation.mutateAsync({
        complaintId: complaint.id,
        staffMemberId: staff.id,
        staffName: staff.name,
        estimatedResolution: estimatedResolution || undefined
      })
      setShowAssignment(false)
      setSelectedStaff('')
      setEstimatedResolution('')
    } catch (error) {
      // Error handled by mutation
    }
  }

  const statusOptions = [
    { value: 'OPEN', label: 'Open' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CLOSED', label: 'Closed' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to complaints
        </button>

        <div className="space-y-6">
          {/* Complaint Header */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <span className="font-mono text-lg font-semibold text-gray-900">
                  {complaint.complaint_number}
                </span>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(complaint.status || 'PENDING')}
                  <span className={`
                    inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                    ${getStatusColor(complaint.status || 'PENDING')}
                  `}>
                    {complaint.status || 'PENDING'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowStatusUpdate(!showStatusUpdate)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Update Status
                </button>
                
                {!complaint.assigned_to && (
                  <button
                    onClick={() => setShowAssignment(!showAssignment)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Assign
                  </button>
                )}
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">{complaint.title}</h1>
            <p className="text-gray-600">{complaint.description}</p>

            {/* Category */}
            {complaint.complaint_categories && (
              <div className="mt-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {complaint.complaint_categories.icon && (
                    <span className="mr-2">{complaint.complaint_categories.icon}</span>
                  )}
                  {complaint.complaint_categories.name}
                </span>
              </div>
            )}
          </div>

          {/* Status Update Form */}
          {showStatusUpdate && (
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    New Status
                  </label>
                  <select
                    id="status"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="block w-full border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select status</option>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {newStatus === 'RESOLVED' && (
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                      Resolution Notes
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      className="block w-full border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe how the complaint was resolved..."
                    />
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updateStatusMutation.isPending}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                  </button>
                  <button
                    onClick={() => setShowStatusUpdate(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Assignment Form */}
          {showAssignment && (
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign to Campus Coordinator</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="staff" className="block text-sm font-medium text-gray-700 mb-2">
                    Campus Coordinator
                  </label>
                  <select
                    id="staff"
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    className="block w-full border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select campus coordinator</option>
                    {campusCoordinators.map((coordinator) => (
                      <option key={coordinator.id} value={coordinator.id}>
                        {coordinator.name} - {coordinator.specialization}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="estimated" className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Resolution Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    id="estimated"
                    value={estimatedResolution}
                    onChange={(e) => setEstimatedResolution(e.target.value)}
                    className="block w-full border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleAssignment}
                    disabled={assignMutation.isPending}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    {assignMutation.isPending ? 'Assigning...' : 'Assign'}
                  </button>
                  <button
                    onClick={() => setShowAssignment(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Information */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Student Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-500 mr-3" />
                  <span className="font-medium text-gray-900">{complaint.student_name}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-500 mr-3" />
                  <span className="text-gray-600">{complaint.student_contact}</span>
                </div>
                {complaint.student_email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-500 mr-3" />
                    <span className="text-gray-600">{complaint.student_email}</span>
                  </div>
                )}
                {complaint.student_id && (
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-gray-500 mr-3" />
                    <span className="text-gray-600">ID: {complaint.student_id}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Location Details
              </h3>
              <div className="space-y-3">
                {complaint.hostels && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Hostel</span>
                    <p className="text-gray-900">{complaint.hostels.name}</p>
                    {complaint.hostels.location && (
                      <p className="text-sm text-gray-600">{complaint.hostels.location}</p>
                    )}
                  </div>
                )}
                {complaint.rooms && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Room</span>
                    <p className="text-gray-900">
                      Room {complaint.rooms.room_number} (Floor {complaint.rooms.floor_number})
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Timeline
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Created</span>
                  <p className="text-gray-900">{formatDate(complaint.created_at)}</p>
                </div>
                {complaint.assigned_at && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Assigned</span>
                    <p className="text-gray-900">{formatDate(complaint.assigned_at)}</p>
                  </div>
                )}
                {complaint.estimated_resolution && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Estimated Resolution</span>
                    <p className="text-gray-900">{formatDate(complaint.estimated_resolution)}</p>
                  </div>
                )}
                {complaint.resolved_at && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Resolved</span>
                    <p className="text-gray-900">{formatDate(complaint.resolved_at)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Assignment Information */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserCheck className="h-5 w-5 mr-2" />
                Assignment
              </h3>
              {complaint.assigned_to ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Assigned to</span>
                    <p className="text-gray-900">{complaint.assigned_to}</p>
                  </div>
                  {complaint.assigned_to_contact && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Contact</span>
                      <p className="text-gray-600">{complaint.assigned_to_contact}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 italic">Not assigned yet</p>
              )}
            </div>
          </div>

          {/* Resolution Notes */}
          {complaint.resolution_notes && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Resolution Notes
              </h3>
              <p className="text-gray-600 whitespace-pre-wrap">{complaint.resolution_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 