import { useState } from 'react'
import { Home, ClipboardList, User, Star, Clock, Shield } from 'lucide-react'
import { HostelSelector } from '../components/HostelSelector'
import { RoomSelector } from '../components/RoomSelector'
import { CategorySelector } from '../components/CategorySelector'
import { ComplaintForm } from '../components/ComplaintForm'
import { ComplaintSuccess } from '../components/ComplaintSuccess'

type Step = 'hostel' | 'room' | 'category' | 'form' | 'success'

interface SelectionState {
  hostelId?: string
  roomText?: string
  categoryId?: string
  complaintNumber?: string
}

export function ComplaintKiosk() {
  const [currentStep, setCurrentStep] = useState<Step>('hostel')
  const [selection, setSelection] = useState<SelectionState>({})

  const handleHostelSelect = (hostelId: string) => {
    setSelection(prev => ({ ...prev, hostelId, roomText: undefined }))
    setCurrentStep('room')
  }

  const handleRoomSelect = (roomText: string) => {
    setSelection(prev => ({ ...prev, roomText }))
    setCurrentStep('category')
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelection(prev => ({ ...prev, categoryId }))
    setCurrentStep('form')
  }

  const handleFormSuccess = (complaintNumber: string) => {
    setSelection(prev => ({ ...prev, complaintNumber }))
    setCurrentStep('success')
  }

  const handleNewComplaint = () => {
    setSelection({})
    setCurrentStep('hostel')
  }

  const handleBack = () => {
    switch (currentStep) {
      case 'room': setCurrentStep('hostel'); break
      case 'category': setCurrentStep('room'); break
      case 'form': setCurrentStep('category'); break
      default: break
    }
  }

  const steps = ['hostel', 'room', 'category', 'form', 'success']
  const currentStepNumber = steps.indexOf(currentStep) + 1
  const progressPercentage = (currentStepNumber / 5) * 100

  return (
    <div className="min-h-screen w-full pt-28 pb-12 safe-top safe-bottom">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">
            Student Complaint <span className="text-gradient-gold">Portal</span>
          </h1>
          <p className="mt-4 text-lg text-primary-200 max-w-3xl mx-auto">
            Submit your hostel maintenance requests quickly and securely. Our advanced system ensures 24/7 monitoring and rapid response to make your stay comfortable.
          </p>
        </div>

        {/* Main Card */}
        <main className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-luxury">
          {/* Progress Indicator */}
          <div className="p-8 border-b border-white/20">
            <h2 className="text-xs text-gold-300 uppercase tracking-widest font-bold text-center">Step {currentStepNumber} of 5</h2>
            <div className="mt-4 w-full bg-black/20 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-gold-400 to-gold-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-white/60 mt-2">
              <span>Select Hostel</span>
              <span>Details</span>
              <span>Complete</span>
            </div>
          </div>

          {/* Step Content */}
          <div className="p-8 min-h-[500px]">
            {currentStep === 'hostel' && <HostelSelector onSelect={handleHostelSelect} selectedHostelId={selection.hostelId} />}
            {currentStep === 'room' && selection.hostelId && <RoomSelector hostelId={selection.hostelId} onSelect={handleRoomSelect} onBack={handleBack} />}
            {currentStep === 'category' && <CategorySelector onSelect={handleCategorySelect} onBack={handleBack} />}
            {currentStep === 'form' && selection.hostelId && selection.roomText && selection.categoryId && <ComplaintForm hostelId={selection.hostelId} roomText={selection.roomText} categoryId={selection.categoryId} onBack={handleBack} onSuccess={handleFormSuccess} />}
            {currentStep === 'success' && selection.complaintNumber && <ComplaintSuccess complaintNumber={selection.complaintNumber} onNewComplaint={handleNewComplaint} />}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="text-center mt-12 text-primary-200/80 text-sm">
          <div className="inline-flex items-center space-x-4">
              <span className="flex items-center space-x-1.5"><Shield size={14} className="text-gold-400" /><span>Secure & Encrypted</span></span>
              <span className="text-white/20">|</span>
              <span className="flex items-center space-x-1.5"><Clock size={14} className="text-gold-400" /><span>24/7 Support</span></span>
              <span className="text-white/20">|</span>
              <span className="flex items-center space-x-1.5"><Star size={14} className="text-gold-400" /><span>Premium Service</span></span>
          </div>
          <p className="mt-4 text-white/50 text-xs">© {new Date().getFullYear()} Sarat Chandra Academy. All rights reserved.</p>
        </footer>
        
      </div>
    </div>
  )
} 