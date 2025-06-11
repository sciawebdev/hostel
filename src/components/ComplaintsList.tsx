import { useState } from 'react'
import { 
  Eye, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  MapPin,
  User,
  Calendar,
  Filter,
  Building
} from 'lucide-react'
import { useHostels } from '../hooks/useHostels'
import { COMPLAINT_WORKFLOW_STATUS } from '../lib/supabase'
import type { Complaint } from '../lib/supabase'

interface ComplaintsListProps {
  complaints: Complaint[]
  isLoading: boolean
  onSelectComplaint: (id: string) => void
  onHostelChange: (hostelId: string) => void
  selectedHostel: string
}

export function ComplaintsList({
  complaints,
  isLoading,
  onSelectComplaint,
  onHostelChange,
  selectedHostel,
}: ComplaintsListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: hostels = [] } = useHostels()

  const getStatusIcon = (status: string) => {
    const s = status as keyof typeof COMPLAINT_WORKFLOW_STATUS;
    switch (s) {
      case COMPLAINT_WORKFLOW_STATUS.VERIFICATION_PENDING:
      case COMPLAINT_WORKFLOW_STATUS.COST_ESTIMATION_PENDING:
      case COMPLAINT_WORKFLOW_STATUS.PROPOSAL_SUBMITTED:
      case COMPLAINT_WORKFLOW_STATUS.WORK_VERIFICATION_PENDING:
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case COMPLAINT_WORKFLOW_STATUS.WORK_IN_PROGRESS:
        return <Clock className="h-4 w-4 text-blue-500" />
      case COMPLAINT_WORKFLOW_STATUS.RESOLVED:
      case COMPLAINT_WORKFLOW_STATUS.CLOSED:
      case COMPLAINT_WORKFLOW_STATUS.VERIFIED:
      case COMPLAINT_WORKFLOW_STATUS.PROPOSAL_APPROVED:
      case COMPLAINT_WORKFLOW_STATUS.WORK_DONE:
      case COMPLAINT_WORKFLOW_STATUS.WORK_VERIFIED:
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    const s = status as keyof typeof COMPLAINT_WORKFLOW_STATUS;
    switch (s) {
      case COMPLAINT_WORKFLOW_STATUS.VERIFICATION_PENDING:
      case COMPLAINT_WORKFLOW_STATUS.COST_ESTIMATION_PENDING:
      case COMPLAINT_WORKFLOW_STATUS.PROPOSAL_SUBMITTED:
      case COMPLAINT_WORKFLOW_STATUS.WORK_VERIFICATION_PENDING:
        return 'bg-orange-100 text-orange-800'
      case COMPLAINT_WORKFLOW_STATUS.WORK_IN_PROGRESS:
        return 'bg-blue-100 text-blue-800'
      case COMPLAINT_WORKFLOW_STATUS.RESOLVED:
      case COMPLAINT_WORKFLOW_STATUS.CLOSED:
      case COMPLAINT_WORKFLOW_STATUS.VERIFIED:
      case COMPLAINT_WORKFLOW_STATUS.PROPOSAL_APPROVED:
      case COMPLAINT_WORKFLOW_STATUS.WORK_DONE:
      case COMPLAINT_WORKFLOW_STATUS.WORK_VERIFIED:
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: number | null) => {
    if (!priority) return 'bg-gray-100 text-gray-800'
    if (priority >= 3) return 'bg-red-100 text-red-800'
    if (priority >= 2) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-48"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <div className="flex-1">
            <label htmlFor="hostel-filter" className="sr-only">Filter by hostel</label>
            <select
              id="hostel-filter"
              value={selectedHostel}
              onChange={(e) => onHostelChange(e.target.value)}
              className="block w-full max-w-xs border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Hostels</option>
              {hostels.map((hostel) => (
                <option key={hostel.id} value={hostel.id}>
                  {hostel.name}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-500">
            {complaints.length} complaint{complaints.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Complaints List */}
      {complaints.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
          <p className="text-gray-500">
            {selectedHostel ? 'Try selecting a different hostel or clearing the filter.' : 'No complaints have been submitted yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <div 
              key={complaint.id} 
              className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectComplaint(complaint.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-mono text-sm font-medium text-gray-900">
                      {complaint.complaint_number}
                    </span>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(complaint.status || 'PENDING')}
                      <span className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${getStatusColor(complaint.status || 'PENDING')}
                      `}>
                        {complaint.status || 'PENDING'}
                      </span>
                    </div>
                    {complaint.priority && (
                      <span className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${getPriorityColor(complaint.priority)}
                      `}>
                        Priority {complaint.priority}
                      </span>
                    )}
                  </div>

                  {/* Title and Description */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                    {complaint.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {complaint.description}
                  </p>

                  {/* Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center text-gray-500">
                      <User className="h-4 w-4 mr-2" />
                      <span className="truncate">{complaint.student_name}</span>
                    </div>
                    
                    {complaint.hostels && (
                      <div className="flex items-center text-gray-500">
                        <Building className="h-4 w-4 mr-2" />
                        <span className="truncate">{complaint.hostels.name}</span>
                      </div>
                    )}
                    
                    {complaint.rooms && (
                      <div className="flex items-center text-gray-500">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>Room {complaint.rooms.room_number}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{formatDate(complaint.created_at)}</span>
                    </div>
                  </div>

                  {/* Category */}
                  {complaint.complaint_categories && (
                    <div className="mt-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {complaint.complaint_categories.icon && (
                          <span className="mr-2">{complaint.complaint_categories.icon}</span>
                        )}
                        {complaint.complaint_categories.name}
                      </span>
                    </div>
                  )}

                  {/* Assignment Info */}
                  {complaint.assigned_to && (
                    <div className="mt-3 p-2 bg-blue-50 rounded-md">
                      <p className="text-sm text-blue-800">
                        <strong>Assigned to:</strong> {complaint.assigned_to}
                        {complaint.estimated_resolution && (
                          <span className="ml-2">
                            (Est. completion: {formatDate(complaint.estimated_resolution)})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="ml-4 flex-shrink-0">
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 