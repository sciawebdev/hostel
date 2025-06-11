import { useState } from 'react'
import { ChevronLeft, Send } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { useComplaintSubmission, type ComplaintSubmissionData } from '../hooks/useComplaintSubmission'

interface ComplaintFormProps {
  hostelId: string
  roomText: string
  categoryId: string
  onBack: () => void
  onSuccess: (complaintNumber: string) => void
}

interface FormErrors {
  title?: string
  description?: string
  student_name?: string
}

export function ComplaintForm({ hostelId, roomText, categoryId, onBack, onSuccess }: ComplaintFormProps) {
  const { user } = useAuth()
  const [isAnonymous, setIsAnonymous] = useState(false)
  const submitComplaintMutation = useComplaintSubmission()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    student_name: user?.name ?? '',
    student_id: user?.id ?? '',
    urgency_level: 2,
  })

  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!isAnonymous && !formData.student_name.trim()) newErrors.student_name = 'Your name is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const submissionData: ComplaintSubmissionData = {
      hostel_id: hostelId,
      room_text: roomText,
      category_id: categoryId,
      title: formData.title,
      description: formData.description,
      urgency_level: formData.urgency_level,
      student_name: isAnonymous ? 'Anonymous' : formData.student_name,
      student_id: isAnonymous ? undefined : formData.student_id,
    }

    submitComplaintMutation.mutate(submissionData, {
      onSuccess: (data) => {
        onSuccess(data.complaint_number)
      }
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: name === 'urgency_level' ? Number(value) : value }))
  }

  return (
    <div className="animate-scale-in">
      <button onClick={onBack} className="flex items-center text-sm text-primary-200/80 hover:text-white mb-6 transition-colors">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Category Selection
      </button>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-white">Provide Complaint Details</h3>
          <p className="text-primary-200/80 mt-1">Your detailed description helps us resolve the issue faster.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-primary-100 mb-2">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full bg-white/5 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none transition-all"
              placeholder="e.g., Leaking pipe in washroom"
            />
            {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
          </div>
          <div>
            <label htmlFor="urgency_level" className="block text-sm font-medium text-primary-100 mb-2">Urgency</label>
            <select
              id="urgency_level"
              name="urgency_level"
              value={formData.urgency_level}
              onChange={handleInputChange}
              className="w-full bg-white/5 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none appearance-none transition-all"
            >
              <option value={1} className="bg-primary-900">Low</option>
              <option value={2} className="bg-primary-900">Medium</option>
              <option value={3} className="bg-primary-900">High</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-primary-100 mb-2">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full bg-white/5 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none h-32 resize-y transition-all"
            placeholder="Please provide as much detail as possible..."
          />
          {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
        </div>

        <div className="border-t border-white/10 pt-6">
          <div className="flex items-center justify-between">
             <h4 className="text-lg font-semibold text-white">Your Information</h4>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAnonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 rounded border-white/30 bg-white/10 text-gold-500 focus:ring-gold-500 transition-all"
              />
              <label htmlFor="isAnonymous" className="ml-2 block text-sm text-primary-200">
                Submit Anonymously
              </label>
            </div>
          </div>
         
          {!isAnonymous && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 animate-fade-in">
              <div>
                <label htmlFor="student_name" className="block text-sm font-medium text-primary-100 mb-2">Name</label>
                <input
                  type="text"
                  id="student_name"
                  name="student_name"
                  value={formData.student_name}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none transition-all"
                  placeholder="Your full name"
                />
                {errors.student_name && <p className="text-red-400 text-sm mt-1">{errors.student_name}</p>}
              </div>
              <div>
                <label htmlFor="student_id" className="block text-sm font-medium text-primary-100 mb-2">Student ID (Optional)</label>
                <input
                  type="text"
                  id="student_id"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none transition-all"
                  placeholder="Your student ID"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6 border-t border-white/10">
          <button
            type="submit"
            className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-bold text-primary-950 bg-gradient-to-r from-gold-300 to-gold-500 rounded-full transition-all duration-300 ease-in-out overflow-hidden hover:shadow-gold disabled:opacity-50"
            disabled={submitComplaintMutation.isPending}
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-gold-200 to-gold-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
            <span className="relative flex items-center">
              {submitComplaintMutation.isPending ? 'Submitting...' : 'Submit Complaint'}
              {!submitComplaintMutation.isPending && <Send className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />}
            </span>
          </button>
        </div>
      </form>
    </div>
  )
} 