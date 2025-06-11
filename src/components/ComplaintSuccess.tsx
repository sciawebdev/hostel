import { CheckCircle, Home, Copy, Phone, Clock, UserCheck, Wrench } from 'lucide-react'

interface ComplaintSuccessProps {
  complaintNumber: string
  onNewComplaint: () => void
}

export function ComplaintSuccess({ complaintNumber, onNewComplaint }: ComplaintSuccessProps) {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(complaintNumber)
      // You could add a toast here for feedback
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = complaintNumber
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  return (
    <div className="space-y-8 text-center animate-fade-in">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl">
          <CheckCircle className="w-14 h-14 text-white" />
        </div>
      </div>

      {/* Success Message */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-gray-900">Complaint Submitted Successfully!</h2>
        <p className="text-lg text-gray-700 max-w-lg mx-auto">
          Your maintenance request has been received and assigned to our team. 
          We'll get back to you soon.
        </p>
      </div>

      {/* Complaint Number */}
      <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
        <h3 className="text-xl font-semibold text-blue-900 mb-4">Your Complaint Reference</h3>
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="bg-white rounded-lg px-6 py-4 border-2 border-blue-300 shadow-lg">
            <code className="text-2xl font-mono font-bold text-blue-800">
              {complaintNumber}
            </code>
          </div>
          <button
            onClick={copyToClipboard}
            className="p-3 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors min-h-12 min-w-12 border border-blue-300 bg-white"
            title="Copy complaint number"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-blue-800 font-medium">
          💡 Save this number - you'll need it to track your complaint status
        </p>
      </div>

      {/* Next Steps */}
      <div className="bg-white rounded-2xl p-8 border border-gray-300 shadow-lg text-left">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">What happens next?</h3>
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">1. Assignment</h4>
              <p className="text-gray-700">Your complaint will be assigned to the appropriate maintenance staff within 1 hour.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">2. Contact</h4>
              <p className="text-gray-700">The assigned staff member will contact you to schedule a visit or gather more details.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wrench className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">3. Resolution</h4>
              <p className="text-gray-700">The issue will be resolved and you'll receive confirmation when the work is complete.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-left">
            <h5 className="font-semibold text-red-900 mb-1">Need immediate assistance?</h5>
            <p className="text-sm text-red-800">
              For urgent issues that can't wait, contact the hostel warden directly or 
              call our emergency maintenance hotline at <strong>+91-XXX-XXX-XXXX</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4 pt-4">
        <button
          onClick={onNewComplaint}
          className="btn-primary w-full flex items-center justify-center space-x-3 py-4 text-lg rounded-xl"
        >
          <Home className="w-6 h-6" />
          <span>Submit Another Complaint</span>
        </button>
        
        <p className="text-sm text-gray-600 pt-2">
          Thank you for using the Sarat Chandra Academy Hostel Management System
        </p>
      </div>
    </div>
  )
} 