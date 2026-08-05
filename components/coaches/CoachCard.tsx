'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Heart, MapPin, Star, Dumbbell } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useFavorites } from '@/lib/hooks/useFavorites'
import { computeBadges } from '@/lib/utils/coachBadges'

export type CoachCardData = {
  id: string
  sport: string | null
  hourly_rate: number | null
  location: string | null
  years_experience: number | null
  verification_status: string | null
  created_at: string | null
  profiles: { full_name: string | null; avatar_url: string | null } | null
  reviews: { rating: number | null }[] | null
}

type PrimaryAction = { href: string } | { label: string; onClick: (coachId: string) => void }

interface CoachCardProps {
  coach: CoachCardData
  action?: PrimaryAction
  showFavorite?: boolean
}

const AVATAR_GRADIENTS = [
  'from-orange-400 to-pink-500',
  'from-blue-500 to-indigo-600',
  'from-purple-400 to-indigo-500',
  'from-teal-400 to-emerald-500',
  'from-amber-400 to-orange-500',
]

function initials(name: string | null) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function gradientFor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length]
}

export default function CoachCard({ coach, action, showFavorite = true }: CoachCardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isFavorited, isLoggedIn, loading, toggleFavorite } = useFavorites()
  const [pending, setPending] = useState(false)

  const reviews = coach.reviews ?? []
  const reviewCount = reviews.length
  const avgRating =
    reviewCount === 0 ? null : reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviewCount

  const name = coach.profiles?.full_name ?? 'Coach'
  const badges = computeBadges(coach, avgRating).slice(0, 2)
  const favorited = isFavorited(coach.id)

  async function handleFavoriteClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (loading || pending) return
    if (!isLoggedIn) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname ?? '/')}`)
      return
    }
    setPending(true)
    await toggleFavorite(coach.id)
    setPending(false)
  }

  const resolvedAction: PrimaryAction = action ?? { href: `/coaches/${coach.id}` }

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {coach.profiles?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coach.profiles.avatar_url}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientFor(
              coach.id,
            )} text-4xl font-bold text-white`}
          >
            {initials(name)}
          </div>
        )}
        {badges.length > 0 && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {badges.map((badge) => (
              <Badge key={badge.label} variant={badge.variant}>
                {badge.label}
              </Badge>
            ))}
          </div>
        )}
        {showFavorite && (
          <button
            type="button"
            aria-label={favorited ? 'Remove from favorites' : 'Save coach'}
            onClick={handleFavoriteClick}
            disabled={pending}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm transition-colors hover:text-red-500 disabled:opacity-60"
          >
            <Heart className={favorited ? 'h-4 w-4 fill-red-500 text-red-500' : 'h-4 w-4'} />
          </button>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 truncate">{name}</h3>
        <div className="mt-1 space-y-0.5 text-sm text-gray-500">
          <p className="flex items-center gap-1.5">
            <Dumbbell className="h-3.5 w-3.5 text-gray-400" />
            {coach.sport ?? 'Coach'}
          </p>
          {coach.location && (
            <p className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              {coach.location}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          {avgRating !== null ? (
            <span className="flex items-center gap-1 font-medium text-gray-900">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {avgRating.toFixed(1)}
              <span className="font-normal text-gray-400">({reviewCount})</span>
            </span>
          ) : (
            <span className="text-gray-400">No reviews yet</span>
          )}
          <span className="font-semibold text-blue-600">
            {coach.hourly_rate != null ? (
              <>
                R{coach.hourly_rate} <span className="text-xs font-normal text-gray-400">/hr</span>
              </>
            ) : (
              <span className="text-xs font-normal text-gray-400">Rate on request</span>
            )}
          </span>
        </div>

        {'href' in resolvedAction ? (
          <Link href={resolvedAction.href} className="mt-4 block">
            <Button className="w-full !bg-indigo-900 hover:!bg-indigo-800" size="sm">
              View Profile
            </Button>
          </Link>
        ) : (
          <Button
            className="mt-4 w-full !bg-indigo-900 hover:!bg-indigo-800"
            size="sm"
            onClick={() => resolvedAction.onClick(coach.id)}
          >
            {resolvedAction.label}
          </Button>
        )}
      </div>
    </div>
  )
}
