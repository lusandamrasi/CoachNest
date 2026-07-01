import Image from 'next/image'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

export interface ProfileHeaderBadge {
  label: string
  variant?: 'blue' | 'green' | 'gray'
}

export interface ProfileHeaderInfoRow {
  icon: React.ReactNode
  text: string
}

interface ProfileHeaderCardProps {
  fullName: string | null
  avatarUrl: string | null
  badges?: ProfileHeaderBadge[]
  infoRows?: ProfileHeaderInfoRow[]
  editHref?: string
  editLabel?: string
}

function initials(name: string | null) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function ProfileHeaderCard({
  fullName,
  avatarUrl,
  badges = [],
  infoRows = [],
  editHref,
  editLabel = 'Edit Profile',
}: ProfileHeaderCardProps) {
  const displayName = fullName ?? 'Unnamed'

  return (
    <Card padding="lg">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-5">
          <div className="h-[120px] w-[120px] flex-shrink-0 overflow-hidden rounded-full border border-gray-200 bg-blue-600">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={120}
                height={120}
                className="h-[120px] w-[120px] object-cover"
                unoptimized
              />
            ) : (
              <span className="flex h-[120px] w-[120px] items-center justify-center text-4xl font-semibold text-white">
                {initials(fullName)}
              </span>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
              {badges.map((b) => (
                <Badge key={b.label} variant={b.variant ?? 'blue'}>
                  {b.label}
                </Badge>
              ))}
            </div>

            {infoRows.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
                {infoRows.map((row, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5">
                    {row.icon}
                    {row.text}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {editHref && (
          <Link href={editHref} className="self-start">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pencil className="h-4 w-4" />
              {editLabel}
            </Button>
          </Link>
        )}
      </div>
    </Card>
  )
}
