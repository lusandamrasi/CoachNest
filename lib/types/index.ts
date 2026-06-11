export type UserRole = 'coach' | 'client'

export interface Profile {
  id: string
  role: UserRole | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface CoachProfile {
  id: string
  sport: string
  bio: string | null
  hourly_rate: number | null
  location: string | null
  years_experience: number | null
  intro_video_url: string | null
  is_published: boolean
  created_at: string
}

export interface CoachWithProfile extends Profile {
  coach_profiles: CoachProfile
}

export interface AvailabilitySlot {
  id: string
  coach_id: string
  day_of_week: number
  start_time: string
  end_time: string
}
