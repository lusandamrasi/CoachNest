'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, AlertCircle, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import LanguagesSelect from '@/components/coach/LanguagesSelect'
import LocationAutocomplete from '@/components/coach/LocationAutocomplete'
import TravelRadiusMap from '@/components/coach/TravelRadiusMap'

const SPORT_OPTIONS = [
  'Tennis',
  'Basketball',
  'Yoga',
  'Golf',
  'Soccer',
  'Swimming',
  'Boxing',
  'Running',
  'Cycling',
  'Pilates',
  'Cricket',
] as const

const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const
const COACHING_TYPES = ['Private', 'Group', 'Online', 'School', 'Club'] as const
const BIO_MAX = 500

interface ClientProfileFormProps {
  userId: string
  authEmail: string | null
  initial: {
    full_name: string | null
    avatar_url: string | null
    bio: string | null
    location: string | null
    location_lat: number | null
    location_lng: number | null
    travel_radius_km: number | null
    is_parent: boolean | null
    age: number | null
    preferred_sports: string[] | null
    languages_spoken: string[] | null
    experience_levels: string[] | null
    coaching_types: string[] | null
    email: string | null
    phone_number: string | null
  }
}

function getInitials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

type Toast = { kind: 'success' | 'error'; message: string } | null

export default function ClientProfileForm({ authEmail, initial }: ClientProfileFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(initial.full_name ?? '')
  const [bio, setBio] = useState(initial.bio ?? '')
  const [location, setLocation] = useState(initial.location ?? '')
  const [locationLat, setLocationLat] = useState<number | null>(initial.location_lat)
  const [locationLng, setLocationLng] = useState<number | null>(initial.location_lng)
  const [travelRadius, setTravelRadius] = useState<number>(initial.travel_radius_km ?? 0)
  const [isParent, setIsParent] = useState<boolean>(initial.is_parent ?? false)
  const [age, setAge] = useState<string>(initial.age != null ? String(initial.age) : '')
  const [email, setEmail] = useState(initial.email ?? authEmail ?? '')
  const [phoneNumber, setPhoneNumber] = useState(initial.phone_number ?? '')

  const [preferredSports, setPreferredSports] = useState<string[]>(initial.preferred_sports ?? [])
  const [languages, setLanguages] = useState<string[]>(initial.languages_spoken ?? [])
  const [experienceLevels, setExperienceLevels] = useState<string[]>(initial.experience_levels ?? [])
  const [coachingTypes, setCoachingTypes] = useState<string[]>(initial.coaching_types ?? [])

  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatar_url)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<Toast>(null)

  function showToast(t: Toast) {
    setToast(t)
    if (t) setTimeout(() => setToast(null), 3500)
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    let nextAvatarUrl = avatarUrl

    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser()
      if (authErr || !authData?.user) {
        throw new Error('Your session has expired. Please sign in again.')
      }
      const authedId = authData.user.id

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() ?? 'jpg'
        const path = `${authedId}/avatar.${ext}`
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
        .eq('id', authedId)
      if (pErr) throw new Error(`Profile update failed: ${pErr.message}`)

      const parsedAge = age === '' ? null : Number(age)

      const clientPayload = {
        id: authedId,
        bio: bio.trim() || null,
        location: location.trim() || null,
        location_lat: locationLat,
        location_lng: locationLng,
        travel_radius_km: travelRadius,
        is_parent: isParent,
        age: parsedAge,
        preferred_sports: preferredSports,
        languages_spoken: languages,
        experience_levels: experienceLevels,
        coaching_types: coachingTypes,
        email: email.trim() || null,
        phone_number: phoneNumber.trim() || null,
      }

      const { error: cErr } = await supabase
        .from('client_profiles')
        .upsert(clientPayload, { onConflict: 'id' })

      if (cErr) throw new Error(`Client profile update failed: ${cErr.message}`)

      setAvatarUrl(nextAvatarUrl)
      setAvatarFile(null)
      setAvatarPreview(null)
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
  const displayAvatar = avatarPreview ?? avatarUrl

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
          {toast.kind === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      {/* Section A — Basic Info */}
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-gray-900">Basic Info</h2>
        <p className="mt-1 text-sm text-gray-500">
          Coaches see these details when you request a session.
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

          <div>
            <p className="text-sm font-medium text-gray-700">Location</p>
            <div className="mt-1">
              <LocationAutocomplete
                id="location"
                placeholder="Cape Town, ZA"
                value={{ address: location, lat: locationLat, lng: locationLng }}
                onChange={(next) => {
                  setLocation(next.address)
                  setLocationLat(next.lat)
                  setLocationLng(next.lng)
                }}
              />
            </div>
          </div>

          <Input
            id="age"
            type="number"
            min={0}
            label="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="28"
          />

          <Input
            id="email"
            type="email"
            label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <Input
            id="phone_number"
            type="tel"
            label="Phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+27 82 123 4567"
            autoComplete="tel"
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
            placeholder="Tell coaches a bit about yourself, your goals, and any preferences."
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <div className="flex justify-end">
            <span className={`text-xs ${bioCount >= BIO_MAX ? 'text-red-500' : 'text-gray-400'}`}>
              {bioCount} / {BIO_MAX}
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Booking for a child</p>
            <p className="mt-0.5 text-xs text-gray-500">
              Let coaches know you&apos;re a parent booking on behalf of a child.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsParent((v) => !v)}
            aria-pressed={isParent}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isParent ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                isParent ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Section B — Profile Picture */}
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-gray-900">Profile Picture</h2>
        <p className="mt-1 text-sm text-gray-500">A clear photo helps coaches put a face to your name.</p>
        <div className="mt-6 flex items-center gap-5">
          <div className="relative">
            <div className="h-20 w-20 overflow-hidden rounded-full border border-gray-200 bg-blue-600 text-white text-2xl font-bold flex items-center justify-center">
              {displayAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayAvatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                getInitials(fullName || initial.full_name)
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition-colors hover:bg-blue-700"
              aria-label="Upload photo"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {avatarFile ? avatarFile.name : 'Upload a photo'}
            </p>
            <p className="text-xs text-gray-400">JPG, PNG or WebP. Max 5MB.</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-xs font-medium text-blue-600 hover:underline"
            >
              Choose file
            </button>
          </div>
        </div>
      </Card>

      {/* Section C — Preferences */}
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-gray-900">Coaching Preferences</h2>
        <p className="mt-1 text-sm text-gray-500">Help us match you with the right coach.</p>

        <div className="mt-6 space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-700">Preferred sport(s)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SPORT_OPTIONS.map((sport) => {
                const checked = preferredSports.includes(sport)
                return (
                  <label
                    key={sport}
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
                      onChange={() => setPreferredSports(toggle(preferredSports, sport))}
                    />
                    {sport}
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">Experience level(s) preferred</p>
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
            <p className="text-sm font-medium text-gray-700">Coaching type(s) preferred</p>
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
            <p className="text-sm font-medium text-gray-700">Languages spoken</p>
            <div className="mt-2">
              <LanguagesSelect value={languages} onChange={setLanguages} />
            </div>
          </div>
        </div>
      </Card>

      {/* Section D — Travel radius */}
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-gray-900">Travel Radius</h2>
        <p className="mt-1 text-sm text-gray-500">
          How far you&apos;re willing to travel for in-person sessions.
        </p>
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
              Within {travelRadius}km
            </span>
          </div>
          <TravelRadiusMap lat={locationLat} lng={locationLng} radiusKm={travelRadius} />
        </div>
      </Card>

      {/* Save */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/client"
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
