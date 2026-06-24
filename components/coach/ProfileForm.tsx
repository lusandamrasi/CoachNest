'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, AlertCircle, Plus, X, UploadCloud } from 'lucide-react'
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

const AGE_GROUPS = ['Kids (5–12)', 'Teens (13–17)', 'Adults (18+)', 'Seniors (60+)'] as const
const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const
const COACHING_TYPES = ['Private', 'Group', 'Online', 'School', 'Club'] as const

const BIO_MAX = 500
const PHOTOS_MAX = 5
const PHOTO_MAX_BYTES = 5 * 1024 * 1024
const PHOTO_ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

export type SessionPackage = { name: string; price: number | '' }

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
    age_groups_coached: string[] | null
    experience_levels: string[] | null
    coaching_types: string[] | null
    languages_spoken: string[] | null
    session_packages: SessionPackage[] | null
    travel_radius_km: number | null
    coaching_photos: string[] | null
  }
}

type Toast = { kind: 'success' | 'error'; message: string } | null

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

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

  const [ageGroups, setAgeGroups] = useState<string[]>(initial.age_groups_coached ?? [])
  const [experienceLevels, setExperienceLevels] = useState<string[]>(
    initial.experience_levels ?? [],
  )
  const [coachingTypes, setCoachingTypes] = useState<string[]>(initial.coaching_types ?? [])
  const [languages, setLanguages] = useState<string[]>(initial.languages_spoken ?? [])
  const [langDraft, setLangDraft] = useState('')

  const [packages, setPackages] = useState<SessionPackage[]>(initial.session_packages ?? [])
  const [travelRadius, setTravelRadius] = useState<number>(initial.travel_radius_km ?? 0)

  const [photos, setPhotos] = useState<string[]>(initial.coaching_photos ?? [])
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<Toast>(null)

  function showToast(t: Toast) {
    setToast(t)
    if (t) setTimeout(() => setToast(null), 3500)
  }

  function addPackage() {
    setPackages((p) => [...p, { name: '', price: '' }])
  }

  function updatePackage(index: number, field: 'name' | 'price', value: string) {
    setPackages((p) =>
      p.map((pkg, i) =>
        i === index
          ? {
              ...pkg,
              [field]: field === 'price' ? (value === '' ? '' : Number(value)) : value,
            }
          : pkg,
      ),
    )
  }

  function removePackage(index: number) {
    setPackages((p) => p.filter((_, i) => i !== index))
  }

  function commitLanguage() {
    const value = langDraft.trim()
    if (!value) return
    if (!languages.includes(value)) {
      setLanguages([...languages, value])
    }
    setLangDraft('')
  }

  function removeLanguage(value: string) {
    setLanguages(languages.filter((l) => l !== value))
  }

  async function handlePhotoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setPhotoError(null)
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    const remaining = PHOTOS_MAX - photos.length
    if (remaining <= 0) {
      setPhotoError(`You can upload up to ${PHOTOS_MAX} photos.`)
      return
    }

    const toUpload = files.slice(0, remaining)
    const supabase = createClient()
    setPhotoUploading(true)

    try {
      const uploaded: string[] = []
      for (const file of toUpload) {
        if (!PHOTO_ACCEPTED.includes(file.type)) {
          setPhotoError('Photos must be JPG, PNG, or WebP.')
          continue
        }
        if (file.size > PHOTO_MAX_BYTES) {
          setPhotoError('Each photo must be 5MB or smaller.')
          continue
        }
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `${userId}/photos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('coach-media')
          .upload(path, file, { upsert: false, contentType: file.type })
        if (upErr) {
          setPhotoError(`Upload failed: ${upErr.message}`)
          continue
        }
        const { data: pub } = supabase.storage.from('coach-media').getPublicUrl(path)
        uploaded.push(pub.publicUrl)
      }
      if (uploaded.length > 0) {
        setPhotos((prev) => [...prev, ...uploaded])
      }
    } finally {
      setPhotoUploading(false)
    }
  }

  function removePhoto(url: string) {
    setPhotos(photos.filter((p) => p !== url))
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

      const cleanedPackages = packages
        .map((p) => ({ name: p.name.trim(), price: typeof p.price === 'number' ? p.price : 0 }))
        .filter((p) => p.name.length > 0)

      const { error: cErr } = await supabase
        .from('coach_profiles')
        .update({
          sport,
          bio: bio.trim() || null,
          hourly_rate: parsedRate,
          location: location.trim() || null,
          years_experience: parsedYears,
          age_groups_coached: ageGroups,
          experience_levels: experienceLevels,
          coaching_types: coachingTypes,
          languages_spoken: languages,
          session_packages: cleanedPackages,
          travel_radius_km: travelRadius,
          coaching_photos: photos,
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

      {/* Section C — Coaching Details */}
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-gray-900">Coaching Details</h2>
        <p className="mt-1 text-sm text-gray-500">
          Help clients understand the kind of coaching you offer.
        </p>

        <div className="mt-6 space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-700">Age groups coached</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {AGE_GROUPS.map((group) => {
                const checked = ageGroups.includes(group)
                return (
                  <label
                    key={group}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      checked
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={checked}
                      onChange={() => setAgeGroups(toggle(ageGroups, group))}
                    />
                    {group}
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">Experience levels</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {EXPERIENCE_LEVELS.map((level) => {
                const checked = experienceLevels.includes(level)
                return (
                  <label
                    key={level}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      checked
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={checked}
                      onChange={() => setExperienceLevels(toggle(experienceLevels, level))}
                    />
                    {level}
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">Coaching types</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {COACHING_TYPES.map((type) => {
                const checked = coachingTypes.includes(type)
                return (
                  <label
                    key={type}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      checked
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={checked}
                      onChange={() => setCoachingTypes(toggle(coachingTypes, type))}
                    />
                    {type}
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <label htmlFor="languages" className="text-sm font-medium text-gray-700">
              Languages spoken
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
              {languages.map((lang) => (
                <span
                  key={lang}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                >
                  {lang}
                  <button
                    type="button"
                    onClick={() => removeLanguage(lang)}
                    className="rounded-full p-0.5 text-blue-600 hover:bg-blue-100"
                    aria-label={`Remove ${lang}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                id="languages"
                value={langDraft}
                onChange={(e) => setLangDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    commitLanguage()
                  } else if (e.key === 'Backspace' && langDraft === '' && languages.length > 0) {
                    setLanguages(languages.slice(0, -1))
                  }
                }}
                placeholder={languages.length === 0 ? 'Type a language and press Enter' : ''}
                className="flex-1 min-w-[140px] border-0 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Section D — Pricing */}
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>
        <p className="mt-1 text-sm text-gray-500">
          Set your hourly rate, packages, and how far you&apos;ll travel.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Input
            id="hourly_rate"
            type="number"
            min={0}
            label="Hourly rate (ZAR)"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="450"
          />
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium text-gray-700">Session packages</p>
          <div className="mt-2 space-y-2">
            {packages.length === 0 && (
              <p className="text-xs text-gray-400">No packages yet — add bulk pricing like &quot;5 sessions&quot;.</p>
            )}
            {packages.map((pkg, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={pkg.name}
                  onChange={(e) => updatePackage(i, 'name', e.target.value)}
                  placeholder="e.g. 5 sessions"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
                <div className="relative w-36">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    R
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={pkg.price}
                    onChange={(e) => updatePackage(i, 'price', e.target.value)}
                    placeholder="2000"
                    className="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removePackage(i)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                  aria-label="Remove package"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addPackage}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-blue-500 hover:text-blue-600"
          >
            <Plus className="h-4 w-4" />
            Add Package
          </button>
        </div>

        <div className="mt-6">
          <label htmlFor="travel_radius" className="text-sm font-medium text-gray-700">
            Travel radius
          </label>
          <div className="mt-2 flex items-center gap-4">
            <input
              id="travel_radius"
              type="range"
              min={0}
              max={100}
              value={travelRadius}
              onChange={(e) => setTravelRadius(Number(e.target.value))}
              className="flex-1 accent-blue-600"
            />
            <span className="w-44 text-right text-sm text-gray-600">
              Will travel up to {travelRadius}km
            </span>
          </div>
        </div>
      </Card>

      {/* Section E — Intro Video */}
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

      {/* Section F — Coaching Photos */}
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-gray-900">Coaching Photos</h2>
        <p className="mt-1 text-sm text-gray-500">
          Add up to {PHOTOS_MAX} action shots so clients can see you in your element.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {photos.map((url) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Coaching" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(url)}
                className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                aria-label="Remove photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {photos.length < PHOTOS_MAX && (
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={photoUploading}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 transition-colors hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
            >
              <UploadCloud className="h-6 w-6" />
              <span className="text-xs font-medium">
                {photoUploading ? 'Uploading…' : 'Add photo'}
              </span>
            </button>
          )}
        </div>

        {photoError && <p className="mt-3 text-xs text-red-500">{photoError}</p>}

        <input
          ref={photoInputRef}
          type="file"
          accept={PHOTO_ACCEPTED.join(',')}
          multiple
          onChange={handlePhotoFiles}
          className="hidden"
        />
      </Card>

      {/* Save */}
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
