import { Building, MapPin, Users, Crown } from 'lucide-react'

interface Hostel {
  id: string
  name: string
  location: string
  total_floors: number
  warden_name: string
}

const DEMO_HOSTELS: Hostel[] = [
  { id: 'hostel-godavari', name: 'Godavari', location: 'Main Campus', total_floors: 5, warden_name: 'Rajesh Kumar' },
  { id: 'hostel-sarayu', name: 'Sarayu', location: 'Main Campus', total_floors: 4, warden_name: 'Priya Sharma' },
  { id: 'hostel-ganga1', name: 'Ganga 1', location: 'North Campus', total_floors: 6, warden_name: 'Amit Singh' },
  { id: 'hostel-ganga2', name: 'Ganga 2', location: 'North Campus', total_floors: 6, warden_name: 'Sunita Patel' },
  { id: 'hostel-krishna', name: 'Krishna', location: 'South Campus', total_floors: 5, warden_name: 'Vikram Reddy' },
  { id: 'hostel-bhramaputra1', name: 'Bhramaputra 1', location: 'East Campus', total_floors: 4, warden_name: 'Deepak Gupta' },
  { id: 'hostel-bhramaputra2', name: 'Bhramaputra 2', location: 'East Campus', total_floors: 4, warden_name: 'Meera Joshi' },
  { id: 'hostel-narmada', name: 'Narmada', location: 'West Campus', total_floors: 5, warden_name: 'Ravi Agarwal' },
  { id: 'hostel-saraswathi', name: 'Saraswathi', location: 'Central Campus', total_floors: 3, warden_name: 'Kavitha Nair' },
  { id: 'hostel-civils-lt-girls', name: 'Civils Lt Girls', location: 'Academic Block', total_floors: 3, warden_name: 'Anita Verma' },
  { id: 'hostel-benz-circle', name: 'Benz Circle', location: 'Off Campus', total_floors: 2, warden_name: 'Suresh Babu' },
]

interface HostelSelectorProps {
  onSelect: (hostelId: string) => void
  selectedHostelId?: string
}

export function HostelSelector({ onSelect, selectedHostelId }: HostelSelectorProps) {
  return (
    <div className="animate-fade-in space-y-8">
      <div className="text-center">
        <Crown className="mx-auto h-10 w-10 text-gold-400" />
        <h3 className="mt-2 text-3xl font-bold text-white">Select Your Hostel</h3>
        <p className="mt-2 text-primary-200/80">Choose your residence to begin the complaint submission process.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {DEMO_HOSTELS.map((hostel, index) => (
          <HostelCard 
            key={hostel.id} 
            hostel={hostel} 
            isSelected={selectedHostelId === hostel.id}
            onSelect={() => onSelect(hostel.id)}
            animationDelay={`${index * 50}ms`}
          />
        ))}
      </div>

      <p className="text-center text-sm text-primary-200/60">
        Tip: Your hostel warden will be automatically notified of your complaint.
      </p>
    </div>
  )
}

interface HostelCardProps {
  hostel: Hostel
  isSelected: boolean
  onSelect: () => void
  animationDelay: string
}

function HostelCard({ hostel, isSelected, onSelect, animationDelay }: HostelCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`
        group w-full rounded-2xl border p-5 text-left transition-all duration-300
        hover:border-gold-400/60 hover:shadow-gold hover:-translate-y-1
        ${isSelected 
          ? 'bg-white/20 border-gold-400 shadow-gold' 
          : 'bg-white/5 border-white/20'
        }
        animate-slide-up
      `}
      style={{ animationDelay }}
    >
      <div className="flex items-start space-x-4">
        <div className={`
          flex-shrink-0 rounded-lg p-3 transition-all duration-300
          ${isSelected ? 'bg-gold-400' : 'bg-primary-500/50 group-hover:bg-gold-500/80'}
        `}>
          <Building className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-lg text-white">{hostel.name}</h4>
          <div className="mt-2 space-y-2 text-sm">
            <div className="flex items-center text-primary-200/80">
              <MapPin className="mr-2 h-4 w-4 text-gold-300" />
              <span>{hostel.location}</span>
            </div>
            <div className="flex items-center text-primary-200/80">
              <Users className="mr-2 h-4 w-4 text-gold-300" />
              <span>{hostel.total_floors} floors - {hostel.warden_name}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
} 