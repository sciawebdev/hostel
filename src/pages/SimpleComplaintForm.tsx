import { useState, useEffect } from 'react'
import { useHostels } from '../hooks/useHostels'
import { useComplaintCategories } from '../hooks/useComplaintCategories'
import { useComplaintSubmission, type ComplaintSubmissionData } from '../hooks/useComplaintSubmission'
import { useAuth } from '../components/AuthProvider'
import { toast } from 'sonner'

export function SimpleComplaintForm() {
  const { data: hostels } = useHostels()
  const { data: categories } = useComplaintCategories()
  const { user } = useAuth()
  const submitComplaintMutation = useComplaintSubmission()

  const [formData, setFormData] = useState({
    hostel_id: '',
    room_text: '',
    category_id: '',
    title: '',
    description: '',
    urgency_level: 2,
    student_name: user?.name ?? '',
    student_id: user?.id ?? '',
    isAnonymous: false,
  })

  // Optimistic UI state for instant feedback
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitProgress, setSubmitProgress] = useState(0)

  // Fast validation state
  const [isValid, setIsValid] = useState(false)

  // Instant validation on form changes
  useEffect(() => {
    const isFormValid = !!(
      formData.hostel_id && 
      formData.category_id && 
      formData.title.trim() && 
      formData.description.trim() &&
      (formData.isAnonymous || formData.student_name.trim())
    )
    setIsValid(isFormValid)
  }, [formData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as any
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: name === 'urgency_level' ? Number(value) : value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Instant validation feedback
    if (!isValid) {
      toast.error('Please fill all required fields', { duration: 3000 })
      return
    }

    // Start optimistic UI updates
    setIsSubmitting(true)
    setSubmitProgress(20)

    // Simulate progress for better UX
    const progressTimer = setInterval(() => {
      setSubmitProgress(prev => Math.min(prev + 15, 80))
    }, 200)

    const payload: ComplaintSubmissionData = {
      hostel_id: formData.hostel_id,
      room_text: formData.room_text,
      category_id: formData.category_id,
      title: formData.title,
      description: formData.description,
      urgency_level: formData.urgency_level,
      student_name: formData.isAnonymous ? 'Anonymous' : formData.student_name,
      student_id: formData.isAnonymous ? undefined : formData.student_id,
    }

    submitComplaintMutation.mutate(payload, {
      onSuccess: (data) => {
        clearInterval(progressTimer)
        setSubmitProgress(100)
        
        // Show instant success state
        setTimeout(() => {
          setIsSubmitting(false)
          setSubmitProgress(0)
          // Reset only title and description for quick resubmission
          setFormData(prev => ({ 
            ...prev, 
            title: '', 
            description: '',
            room_text: '' 
          }))
        }, 500)
      },
      onError: () => {
        clearInterval(progressTimer)
        setIsSubmitting(false)
        setSubmitProgress(0)
      }
    })
  }

  // Get button state for smooth transitions
  const getButtonState = () => {
    if (isSubmitting && submitProgress < 100) return 'submitting'
    if (submitProgress === 100) return 'success'
    return 'idle'
  }

  const buttonState = getButtonState()

  return (
    <div className="min-h-screen w-full pt-28 pb-12 safe-top safe-bottom flex justify-center px-4">
      <form 
        onSubmit={handleSubmit} 
        className={`w-full max-w-5xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-luxury p-8 space-y-8 transition-all duration-300 ${
          isSubmitting ? 'opacity-95 scale-[0.99]' : 'opacity-100 scale-100'
        }`}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-extrabold text-white">Submit a Complaint</h1>
          {/* Instant validation indicator */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
            isValid 
              ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
              : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
          }`}>
            {isValid ? '✓ Ready to submit' : 'Fill required fields'}
          </div>
        </div>

        {/* Progress bar for submission */}
        {isSubmitting && (
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-300 ease-out"
              style={{ width: `${submitProgress}%` }}
            />
          </div>
        )}

        {/* Hostel / Campus selection */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="hostel_id" className="block text-sm font-medium text-primary-100 mb-2">
              Campus / Hostel<span className="text-red-400">*</span>
            </label>
            <select
              id="hostel_id"
              name="hostel_id"
              value={formData.hostel_id}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full bg-white/5 border border-white/20 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none appearance-none transition-all duration-200 ${
                isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white/10'
              } ${formData.hostel_id ? 'border-green-400/50' : ''}`}
            >
              <option value="" disabled>Select campus / hostel...</option>
              {hostels?.map(h => (
                <option key={h.id} value={h.id} className="bg-primary-900 text-white">
                  {h.name} ({h.location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="room_text" className="block text-sm font-medium text-primary-100 mb-2">Room / Area</label>
            <input
              type="text"
              id="room_text"
              name="room_text"
              value={formData.room_text}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g., 101 or Common Bathroom"
              className={`w-full bg-white/5 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none transition-all duration-200 ${
                isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white/10'
              }`}
            />
          </div>
        </div>

        {/* Category and urgency */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-primary-100 mb-2">
              Issue Category<span className="text-red-400">*</span>
            </label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full bg-white/5 border border-white/20 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none appearance-none transition-all duration-200 ${
                isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white/10'
              } ${formData.category_id ? 'border-green-400/50' : ''}`}
            >
              <option value="" disabled>Select issue...</option>
              {categories?.map(c => (
                <option key={c.id} value={c.id} className="bg-primary-900 text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="urgency_level" className="block text-sm font-medium text-primary-100 mb-2">Urgency</label>
            <select
              id="urgency_level"
              name="urgency_level"
              value={formData.urgency_level}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full bg-white/5 border border-white/20 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none appearance-none transition-all duration-200 ${
                isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white/10'
              }`}
            >
              <option value={1} className="bg-primary-900 text-white">🟢 Low</option>
              <option value={2} className="bg-primary-900 text-white">🟡 Medium</option>
              <option value={3} className="bg-primary-900 text-white">🔴 High</option>
            </select>
          </div>
        </div>

        {/* Title & description */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-primary-100 mb-2">
            Title<span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            disabled={isSubmitting}
            className={`w-full bg-white/5 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none transition-all duration-200 ${
              isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white/10'
            } ${formData.title.trim() ? 'border-green-400/50' : ''}`}
            placeholder="Short summary of the issue"
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-primary-100 mb-2">
            Description<span className="text-red-400">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={isSubmitting}
            rows={5}
            className={`w-full bg-white/5 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none transition-all duration-200 resize-y ${
              isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white/10'
            } ${formData.description.trim() ? 'border-green-400/50' : ''}`}
            placeholder="Provide detailed information..."
          />
        </div>

        {/* Student details */}
        <div className="border-t border-white/20 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="isAnonymous" className="text-sm font-medium text-primary-100">Submit Anonymously</label>
            <input
              type="checkbox"
              id="isAnonymous"
              name="isAnonymous"
              checked={formData.isAnonymous}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`h-5 w-5 rounded border-white/30 bg-white/10 text-gold-500 focus:ring-gold-500 transition-all ${
                isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            />
          </div>
          
          {!formData.isAnonymous && (
            <div className="grid md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
              <div>
                <label htmlFor="student_name" className="block text-sm font-medium text-primary-100 mb-2">
                  Name<span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="student_name"
                  name="student_name"
                  value={formData.student_name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full bg-white/5 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none transition-all duration-200 ${
                    isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white/10'
                  } ${formData.student_name.trim() ? 'border-green-400/50' : ''}`}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label htmlFor="student_id" className="block text-sm font-medium text-primary-100 mb-2">Student ID (optional)</label>
                <input
                  type="text"
                  id="student_id"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full bg-white/5 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none transition-all duration-200 ${
                    isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white/10'
                  }`}
                  placeholder="ID number"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={`group relative inline-flex items-center justify-center px-10 py-3 text-lg font-bold rounded-full transition-all duration-300 overflow-hidden min-w-[200px] ${
              buttonState === 'success'
                ? 'bg-green-500 text-white shadow-green-500/30'
                : buttonState === 'submitting'
                ? 'bg-gold-400 text-primary-950 shadow-gold-400/30'
                : isValid
                ? 'text-primary-950 bg-gradient-to-r from-gold-300 to-gold-500 hover:shadow-gold hover:scale-105'
                : 'bg-gray-600 text-gray-300 cursor-not-allowed'
            }`}
          >
            {/* Button content with smooth transitions */}
            <span className={`transition-all duration-300 ${buttonState === 'submitting' ? 'opacity-0' : 'opacity-100'}`}>
              {buttonState === 'success' ? '✓ Submitted!' : 'Submit Complaint'}
            </span>
            
            {/* Loading spinner */}
            {buttonState === 'submitting' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary-950/30 border-t-primary-950 rounded-full animate-spin" />
                <span className="ml-2 text-primary-950">Submitting...</span>
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  )
} 