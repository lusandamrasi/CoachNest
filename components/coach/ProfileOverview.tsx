import Card from '@/components/ui/Card'
import { MapPin, Clock3, Banknote, Mail, Phone } from 'lucide-react'
import ProfileHeaderCard from '@/components/ui/ProfileHeaderCard'

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
  email: string | null
  phoneNumber: string | null
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
  email,
  phoneNumber,
}: ProfileOverviewProps) {
  const badges = [
    ...(sport ? [{ label: sport, variant: 'blue' as const }] : []),
    { label: isPublished ? 'Published' : 'Unpublished', variant: (isPublished ? 'green' : 'gray') as 'green' | 'gray' },
  ]

  const infoRows = [
    ...(location ? [{ icon: <MapPin className="h-4 w-4 text-gray-400" />, text: location }] : []),
    ...(yearsExperience != null
      ? [{
          icon: <Clock3 className="h-4 w-4 text-gray-400" />,
          text: `${yearsExperience} ${yearsExperience === 1 ? 'year' : 'years'} experience`,
        }]
      : []),
    ...(hourlyRate != null
      ? [{ icon: <Banknote className="h-4 w-4 text-gray-400" />, text: `R${hourlyRate} / session` }]
      : []),
    ...(email ? [{ icon: <Mail className="h-4 w-4 text-gray-400" />, text: email }] : []),
    ...(phoneNumber ? [{ icon: <Phone className="h-4 w-4 text-gray-400" />, text: phoneNumber }] : []),
  ]

  return (
    <div className="space-y-6">
      <ProfileHeaderCard
        fullName={fullName ?? 'Unnamed coach'}
        avatarUrl={avatarUrl}
        badges={badges}
        infoRows={infoRows}
        editHref="/dashboard/coach/edit-profile"
      />

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
