export type CoachBadgeData = {
  verification_status: string | null
  created_at: string | null
}

export type ComputedBadge = { label: string; variant: 'green' | 'gray' | 'orange' | 'gold' }

const NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000

export function isNewCoach(createdAt: string | null): boolean {
  if (!createdAt) return false
  const created = new Date(createdAt).getTime()
  if (Number.isNaN(created)) return false
  return Date.now() - created <= NEW_WINDOW_MS
}

export function computeBadges(coach: CoachBadgeData, avgRating: number | null): ComputedBadge[] {
  const badges: ComputedBadge[] = []

  if (avgRating !== null && avgRating >= 4.8) {
    badges.push({ label: 'Top Rated', variant: 'green' })
  }
  if (coach.verification_status === 'verified') {
    badges.push({ label: 'Verified ✓', variant: 'green' })
  } else if (
    coach.verification_status === 'pending' ||
    coach.verification_status === 'id_verified' ||
    coach.verification_status === 'qualification_verified'
  ) {
    badges.push({ label: 'Pending', variant: 'gray' })
  }
  if (isNewCoach(coach.created_at)) {
    badges.push({ label: 'New', variant: 'orange' })
  }

  return badges
}
