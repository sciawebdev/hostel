import { useState } from 'react'
import { ChevronLeft, Home, MapPin, AlertCircle } from 'lucide-react'
import { useHostel } from '../hooks/useHostels'

interface RoomSelectorProps {
  hostelId: string
  onSelect: (roomText: string) => void
  selectedRoomText?: string
  onBack: () => void
}

export function RoomSelector({ hostelId, onSelect, selectedRoomText, onBack }: RoomSelectorProps) {
  const [roomNumber, setRoomNumber] = useState(selectedRoomText || '')
  const [error, setError] = useState('')
  
  const { data: hostel } = useHostel(hostelId)
  const hostelName = hostel?.name || 'Loading...'

  const handleRoomSubmit = () => {
    const trimmedRoom = roomNumber.trim()
    
    if (!trimmedRoom) {
      setError('Please enter a room number or location')
      return
    }

    if (trimmedRoom.length < 1) {
      setError('Please enter a valid room number')
      return
    }

    onSelect(trimmedRoom)
  }

  const handleInputChange = (value: string) => {
    setRoomNumber(value)
    if (error) setError('')
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors min-h-11 min-w-11"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Enter Room Details</h3>
          <p className="text-sm text-gray-600 flex items-center space-x-1">
            <MapPin className="w-4 h-4" />
            <span>{hostelName}</span>
          </p>
        </div>
      </div>

      {/* Room Input Section */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Room Number or Location</h4>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="room-number" className="block text-sm font-semibold text-gray-800 mb-2">
              Enter Room Number or Area <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="room-number"
              value={roomNumber}
              onChange={(e) => handleInputChange(e.target.value)}
              className={`
                w-full px-4 py-3 border-2 rounded-lg text-lg font-medium transition-all duration-200
                ${error 
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500'
                }
                focus:outline-none focus:ring-2 focus:ring-opacity-20
              `}
              placeholder="e.g., 101, 2A, Common Bathroom, Study Hall"
              maxLength={20}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </p>
            )}
          </div>

          <div className="bg-white/50 rounded-lg p-4 border border-blue-100">
            <h5 className="text-sm font-semibold text-gray-800 mb-2">Examples of room/area entries:</h5>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div>
                <p><strong>Room Numbers:</strong></p>
                <p>• 101, 205, 3B, A14</p>
              </div>
              <div>
                <p><strong>Common Areas:</strong></p>
                <p>• Common Bathroom, Study Hall</p>
              </div>
              <div>
                <p><strong>Other Areas:</strong></p>
                <p>• Washroom, Office, Lobby</p>
              </div>
              <div>
                <p><strong>Floor Areas:</strong></p>
                <p>• Ground Floor Corridor</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleRoomSubmit}
            className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 min-h-12"
          >
            Continue with "{roomNumber || 'Room/Area'}"
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="flex space-x-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-sm font-bold">💡</span>
            </div>
          </div>
          <div>
            <h5 className="text-sm font-semibold text-green-800 mb-1">Helpful Tips</h5>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• You can report issues for any room or common area</li>
              <li>• Include floor number if helpful (e.g., "2nd Floor Bathroom")</li>
              <li>• For common areas, be as specific as possible</li>
              <li>• Office rooms, study halls, and corridors are also valid</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 