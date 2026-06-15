'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import AvatarUpload from './AvatarUpload'
import VideoUpload from './VideoUpload'

export const SPORT_OPTIONS = [
  'Tennis',
  'Basketball',
  'Yoga',
  'Golf',
  'Soccer',
  'Swimming',
  'Boxing',
] as const

const BIO_MAX = 500

interface ProfileFormProps {
  userId: string
  initial: {
    full_name: string | null
    avatar_url: string | null
    sport: string | null
    bio: string | null
    hourly_rate: number | null
    location: string | null
    years_experience: number | null
    intro_video_url: string | null
  }
}

type Toast = { kind: 'success' | 'error'; message: string } | null

export default function ProfileForm({ userId, initial }: ProfileFormProps) {
  const router = useRouter()

  const [fullName, setFullName] = useState(initial.full_name ?? '')
  const [location, setLocation] = useState(initial.location ?? '')
  const [sport, setSport] = useState<string>(
    initial.sport && (SPORT_OPTIONS as readonly string[]).includes(initial.sport)
      ? initial.sport
      : SPORT_OPTIONS[0],
  )
  const [years, setYears] = useState<string>(
    initial.years_experience != null ? String(initial.years_experience) : '',
  )
  const [rate, setRate] = useState<string>(
    initial.hourly_rate != null ? String(initial.hourly_rate) : '',
  )
  const [bio, setBio] = useState(initial.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatar_url)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(initial.intro_video_url)

  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<Toast>(null)

  function showToast(t: Toast) {
    setToast(t)
    if (t) setTimeout(() => setToast(null), 3500)
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()

    let nextAvatarUrl = avatarUrl

    try {
      if (avatarFile) {
        const path = `${userId}/avatar.jpg`
        const { error: upErr } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })
        if (upErr) throw new Error(`Avatar upload failed: ${upErr.message}`)

        const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
        nextAvatarUrl = `${pub.publicUrl}?v=${Date.now()}`
      }

      const { error: pErr } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          avatar_url: nextAvatarUrl,
        })
        .eq('id', userId)
      if (pErr) throw new Error(`Profile update failed: ${pErr.message}`)

      const parsedYears = years === '' ? null : Number(years)
      const parsedRate = rate === '' ? null : Number(rate)

      const { error: cErr } = await supabase
        .from('coach_profiles')
        .update({
          sport,
          bio: bio.trim() || null,
          hourly_rate: parsedRate,
          location: location.trim() || null,
          years_experience: parsedYears,
        })
        .eq('id', userId)
      if (cErr) throw new Error(`Coach profile update failed: ${cErr.message}`)

      setAvatarUrl(nextAvatarUrl)
      setAvatarFile(null)
      showToast({ kind: 'success', message: 'Profile updated ✓' })
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      showToast({ kind: 'error', message })
    } finally {
      setSaving(false)
    }
  }

  const bioCount = bio.length

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg ${
            toast.kind === 'success'
              ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
              : 'bg-red-50 text-red-700 ring-1 ring-red-200'
          }`}
          role="status"
        >
          {toast.kind === 'success' ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {toast.message}
        </div>
      )}

      {/* Section A — Basic Info */}
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-gray-900">Basic Info</h2>
        <p className="mt-1 text-sm text-gray-500">
          The essentials clients see when browsing coaches.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Input
            id="full_name"
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Alex Johnson"
            autoComplete="name"
          />
          <Input
            id="location"
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Cape Town, ZA"
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="sport" className="text-sm font-medium text-gray-700">
              Sport
            </label>
            <select
              id="sport"
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              {SPORT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <Input
            id="years_experience"
            type="number"
            min={0}
            label="Years of experience"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            placeholder="5"
          />

          <Input
            id="hourly_rate"
            type="number"
            min={0}
            label="Rate per session (ZAR)"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="450"
          />
        </div>

        <div className="mt-5 flex flex-col gap-1">
          <label htmlFor="bio" className="text-sm font-medium text-gray-700">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
            rows={4}
            maxLength={BIO_MAX}
            placeholder="Tell clients about your coaching style, achievements, and who you love working with."
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <div className="flex justify-end">
            <span className={`text-xs ${bioCount >= BIO_MAX ? 'text-red-500' : 'text-gray-400'}`}>
              {bioCount} / {BIO_MAX}
            </span>
          </div>
        </div>
      </Card>

      {/* Section B — Profile Picture */}
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-gray-900">Profile Picture</h2>
        <p className="mt-1 text-sm text-gray-500">
          A clear, friendly photo helps clients trust you faster.
        </p>
        <div className="mt-6">
          <AvatarUpload
            fullName={fullName || initial.full_name}
            currentUrl={avatarUrl}
            onFileSelected={setAvatarFile}
          />
        </div>
      </Card>

      {/* Section C — Intro Video */}
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-gray-900">Intro Video (max 1 minute)</h2>
        <p className="mt-1 text-sm text-gray-500">
          A short intro is the single biggest driver of bookings.
        </p>
        <div className="mt-6">
          <VideoUpload
            userId={userId}
            initialVideoUrl={videoUrl}
            onVideoSaved={(url) => {
              setVideoUrl(url)
              showToast({ kind: 'success', message: 'Intro video saved ✓' })
              router.refresh()
            }}
            onError={(message) => showToast({ kind: 'error', message })}
          />
        </div>
      </Card>

      {/* Section D — Save */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/coach"
          className="text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          ← Back to dashboard
        </Link>
        <Button type="submit" size="lg" loading={saving}>
          Save Profile
        </Button>
      </div>
    </form>
  )
}
