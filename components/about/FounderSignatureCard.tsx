import Link from 'next/link'
import { Star } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import type { CoachCardData } from '@/components/coaches/CoachCard'
import { computeBadges } from '@/lib/utils/coachBadges'

function initials(name: string | null) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function FounderSignatureCard({ coach }: { coach: CoachCardData }) {
  const reviews = coach.reviews ?? []
  const reviewCount = reviews.length
  const avgRating =
    reviewCount === 0 ? null : reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviewCount

  const name = coach.profiles?.full_name ?? 'Coach'
  const badges = [{ label: 'Founder', variant: 'gold' as const }, ...computeBadges(coach, avgRating).slice(0, 1)]

  return (
    <div className="rounded-2xl bg-indigo-900 p-6 sm:p-7">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-indigo-200">
        Your CoachNest profile
      </p>

      <div className="rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl bg-orange-50">
            {coach.profiles?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coach.profiles.avatar_url}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-lg font-bold text-blue-600">
                {initials(name)}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5">
              {badges.map((badge) => (
                <Badge key={badge.label} variant={badge.variant}>
                  {badge.label}
                </Badge>
              ))}
            </div>
            <h3 className="mt-1 text-base font-bold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500">
              {coach.sport ?? 'Coach'}
              {coach.location ? ` · ${coach.location}` : ''}
            </p>
          </div>
        </div>

        <div className="mt-3 text-sm">
          {avgRating !== null ? (
            <span className="flex items-center gap-1 font-medium text-gray-900">
              <span className="flex items-center text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < Math.round(avgRating) ? 'fill-amber-400' : 'fill-gray-200 text-gray-200'}`}
                  />
                ))}
              </span>
              {avgRating.toFixed(1)}
              <span className="font-normal text-gray-400">
                · {reviewCount} review{reviewCount !== 1 ? 's' : ''}
              </span>
            </span>
          ) : (
            <span className="text-gray-400">No reviews yet</span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <div>
            {coach.hourly_rate != null ? (
              <span className="text-lg font-bold text-gray-900">
                R{coach.hourly_rate} <span className="text-xs font-normal text-gray-400">/hr</span>
              </span>
            ) : (
              <span className="text-sm text-gray-400">Rate on request</span>
            )}
          </div>
          <Link href={`/coaches/${coach.id}`}>
            <Button size="sm" className="!bg-indigo-900 hover:!bg-indigo-800">
              View Profile
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
