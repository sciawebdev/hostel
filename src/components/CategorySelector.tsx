import { useComplaintCategories } from '../hooks/useComplaintCategories'
import { ChevronLeft, AlertTriangle, Wrench, Zap, Droplets, Wifi, Bug, Trash2, Shield, Star } from 'lucide-react'

interface CategorySelectorProps {
  onSelect: (categoryId: string) => void
  selectedCategoryId?: string
  onBack: () => void
}

// Icon mapping for different complaint categories
const getCategoryIcon = (icon: string | null, name: string) => {
  const iconClass = "w-6 h-6"
  
  if (icon) {
    switch (icon.toLowerCase()) {
      case 'wrench': return <Wrench className={iconClass} />
      case 'zap': return <Zap className={iconClass} />
      case 'droplets': return <Droplets className={iconClass} />
      case 'wifi': return <Wifi className={iconClass} />
      case 'bug': return <Bug className={iconClass} />
      case 'trash2': return <Trash2 className={iconClass} />
      case 'shield': return <Shield className={iconClass} />
      default: return <Star className={iconClass} />
    }
  }
  
  // Fallback icons based on category name
  if (name.toLowerCase().includes('electrical')) return <Zap className={iconClass} />
  if (name.toLowerCase().includes('plumbing') || name.toLowerCase().includes('water')) return <Droplets className={iconClass} />
  if (name.toLowerCase().includes('internet') || name.toLowerCase().includes('wifi')) return <Wifi className={iconClass} />
  if (name.toLowerCase().includes('pest') || name.toLowerCase().includes('insect')) return <Bug className={iconClass} />
  if (name.toLowerCase().includes('security')) return <Shield className={iconClass} />
  if (name.toLowerCase().includes('cleaning') || name.toLowerCase().includes('waste')) return <Trash2 className={iconClass} />
  
  return <Wrench className={iconClass} />
}

const getPriorityColor = (priority: number | null) => {
  switch (priority) {
    case 3: return 'border-red-200 bg-red-50 text-red-700'
    case 2: return 'border-amber-200 bg-amber-50 text-amber-700'
    case 1: return 'border-green-200 bg-green-50 text-green-700'
    default: return 'border-gray-200 bg-gray-50 text-gray-700'
  }
}

const getPriorityLabel = (priority: number | null) => {
  switch (priority) {
    case 3: return 'High Priority'
    case 2: return 'Medium Priority'
    case 1: return 'Low Priority'
    default: return 'Normal'
  }
}

export function CategorySelector({ onSelect, selectedCategoryId, onBack }: CategorySelectorProps) {
  const { data: categories, isLoading, error } = useComplaintCategories()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded-lg h-12 mb-4"></div>
          <div className="grid grid-cols-1 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-20"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 text-lg font-medium">Failed to load categories</div>
        <p className="text-gray-600 mt-2">Please check your connection and try again</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors min-h-11 min-w-11"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Select Issue Type</h3>
          <p className="text-sm text-gray-600">What type of problem are you facing?</p>
        </div>
      </div>

      {/* Categories grid */}
      <div className="grid grid-cols-1 gap-3">
        {categories?.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={`
              w-full p-4 rounded-lg border-2 transition-all duration-200 text-left
              ${selectedCategoryId === category.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
              }
              min-h-11 touch-manipulation
            `}
          >
            <div className="flex items-start space-x-4">
              <div className={`
                p-3 rounded-full 
                ${selectedCategoryId === category.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}
              `}>
                {getCategoryIcon(category.icon, category.name)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-gray-900">{category.name}</h4>
                  {category.priority_level && (
                    <span className={`
                      text-xs px-2 py-1 rounded-full font-medium
                      ${getPriorityColor(category.priority_level)}
                    `}>
                      {getPriorityLabel(category.priority_level)}
                    </span>
                  )}
                </div>
                {category.description && (
                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                )}
                {category.estimated_resolution_hours && (
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>⏱️ Est. {category.estimated_resolution_hours}h resolution</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Help text */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h5 className="font-medium text-blue-900">Need help choosing?</h5>
            <p className="text-sm text-blue-700 mt-1">
              Select the category that best describes your issue. You can provide more details in the next step.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 