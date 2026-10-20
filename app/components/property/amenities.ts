import { Baby, CircleParking, Dumbbell, Sparkles, Umbrella, UtensilsCrossed, WavesLadder, Wifi, type LucideIcon } from 'lucide-react'

export const AMENITY_ICONS: Record<string, LucideIcon> = {
  Pool: WavesLadder,
  'Private Beach': Umbrella,
  WiFi: Wifi,
  Restaurant: UtensilsCrossed,
  Spa: Sparkles,
  Gym: Dumbbell,
  'Kids Area': Baby,
  Parking: CircleParking,
}
