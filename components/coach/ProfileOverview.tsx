import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Clock3, Banknote, Pencil } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface ProfileOverviewProps {
  fullName: string | null
  avatarUrl: string | null
  sport: string | null
  bio: string | null
  hourlyRate: number | null
  location: string | null
  yearsExperience: number | null
  introVideoUrl: string | null
  isPublished: boolean
}

export default function ProfileOverview({
  fullName,
  avatarUrl,
  sport,
  bio,
  hourlyRate,
  location,
  yearsExperience,
  introVideoUrl,
  isPublished,
}: ProfileOverviewProps) {
  const initial = (fullName?.trim()?.[0] ?? '?').toUpperCase()

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-5">
            <div className="h-[120px] w-[120px] overflow-hidden rounded-full border border-gray-200 bg-blue-600">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={fullName ?? 'Coach'}
                  width={120}
                  height={120}
                  className="h-[120px] w-[120px] object-cover"
                  unoptimized
                />
              ) : (
                <span className="flex h-[120px] w-[120px] items-center justify-center text-4xl font-semibold text-white">
                  {initial}
                </span>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{fullName ?? 'Unnamed coach'}</h1>
                {sport && <Badge variant="blue">{sport}</Badge>}
                <Badge variant={isPublished ? 'green' : 'gray'}>
                  {isPublished ? 'Published' : 'Unpublished'}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
                {location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {location}
                  </span>
                )}
                {yearsExperience != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-4 w-4 text-gray-400" />
                    {yearsExperience} {yearsExperience === 1 ? 'year' : 'years'} experience
                  </span>
                )}
                {hourlyRate != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Banknote className="h-4 w-4 text-gray-400" />
                    R{hourlyRate} / session
                  </span>
                )}
              </div>
            </div>
          </div>

          <Link href="/dashboard/coach/edit-profile" className="self-start">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pencil className="h-4 w-4" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-lg font-semibold text-gray-900">About</h2>
        <p className="mt-3 whitespace-pre-line text-sm text-gray-700">
          {bio?.trim() ? bio : 'No bio added yet.'}
        </p>
      </Card>

      <Card padding="lg">
        <h2 className="text-lg font-semibold text-gray-900">Intro Video</h2>
        {introVideoUrl ? (
          <video
            key={introVideoUrl}
            src={introVideoUrl}
            controls
            className="mt-4 aspect-video w-full max-w-2xl rounded-xl border border-gray-200 bg-black"
          />
        ) : (
          <p className="mt-3 text-sm text-gray-500">No intro video uploaded yet.</p>
        )}
      </Card>
    </div>
  )
}
