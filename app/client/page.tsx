'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Camera, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

type ClientProfileForm = {
    full_name: string
    bio: string
    location: string
    is_parent: boolean
}

function getInitials(name: string | null) {
    if (!name) return '?'
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function EditClientProfilePage() {
    const router = useRouter()
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [userId, setUserId] = useState<string | null>(null)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [form, setForm] = useState<ClientProfileForm>({
        full_name: '',
        bio: '',
        location: '',
        is_parent: false,
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return router.push('/auth/login')
            setUserId(user.id)

            const [{ data: profile }, { data: clientProfile }] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('id', user.id)
                    .single(),
                supabase
                    .from('client_profiles')
                    .select('bio, location, is_parent')
                    .eq('id', user.id)
                    .single(),
            ])

            if (profile) {
                setAvatarUrl(profile.avatar_url)
                setForm((prev) => ({ ...prev, full_name: profile.full_name ?? '' }))
            }

            if (clientProfile) {
                setForm((prev) => ({
                    ...prev,
                    bio: clientProfile.bio ?? '',
                    location: clientProfile.location ?? '',
                    is_parent: clientProfile.is_parent ?? false,
                }))
            }

            setLoading(false)
        }
        load()
    }, [])

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setAvatarFile(file)
        setAvatarPreview(URL.createObjectURL(file))
    }

    const handleSave = async () => {
        console.log("testing please")
        if (!userId) return
        setSaving(true)
        setError('')
        setSuccess(false)

        let newAvatarUrl = avatarUrl

        // Upload avatar if changed
        if (avatarFile) {
            const ext = avatarFile.name.split('.').pop()
            const path = `${userId}/avatar.${ext}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(path, avatarFile, { upsert: true })

            if (uploadError) {
                setError('Failed to upload avatar. Please try again.')
                setSaving(false)
                return
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(path)

            newAvatarUrl = publicUrl
        }

        // Update profiles table
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                full_name: form.full_name,
                avatar_url: newAvatarUrl,
            })
            .eq('id', userId)

        if (profileError) {
            
            setError('Failed to update profile. Please try again.')
            setSaving(false)
            return
        }

        // Upsert client_profiles table
        const { error: clientError } = await supabase
            .from('client_profiles')
            .upsert({
                id: userId,
                bio: form.bio,
                location: form.location,
                is_parent: form.is_parent,
            })
        console.log("testing")
        if (clientError) {
            
            console.log(userId)
            console.log(clientError.message)
            setError('Failed to update client profile. Please try again!')
            setSaving(false)
            return
        }

        setAvatarUrl(newAvatarUrl)
        setAvatarFile(null)
        setSuccess(true)
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="max-w-xl mx-auto px-4 py-12 space-y-6 animate-pulse">
                <div className="h-8 w-48 bg-gray-100 rounded-xl" />
                <div className="h-64 bg-gray-100 rounded-2xl" />
            </div>
        )
    }

    const displayAvatar = avatarPreview ?? avatarUrl

    return (
        <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
            {/* Back */}
            <Link
                href="/dashboard/client"
                className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to dashboard
            </Link>

            <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
                <p className="text-sm text-gray-400 mt-1">Update your personal information.</p>
            </div>

            {/* Avatar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <p className="text-sm font-semibold text-gray-700 mb-4">Profile Photo</p>
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 font-bold text-2xl flex items-center justify-center border border-blue-100 overflow-hidden">
                            {displayAvatar ? (
                                <img
                                    src={displayAvatar}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                getInitials(form.full_name)
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-colors"
                        >
                            <Camera className="w-3.5 h-3.5" />
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
                        <p className="text-xs text-gray-400 mt-0.5">JPG, PNG or WebP. Max 5MB.</p>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-2 text-xs font-medium text-blue-600 hover:underline"
                        >
                            Choose file
                        </button>
                    </div>
                </div>
            </div>

            {/* Personal info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <p className="text-sm font-semibold text-gray-700">Personal Information</p>

                <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    label="Full Name"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Alex Johnson"
                />

                <Input
                    id="location"
                    name="location"
                    type="text"
                    label="Location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Cape Town"
                />

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Bio</label>
                    <textarea
                        value={form.bio}
                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                        placeholder="Tell coaches a bit about yourself..."
                        rows={4}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none resize-none"
                    />
                </div>

                {/* Is parent toggle */}
                <div className="flex items-center justify-between py-2">
                    <div>
                        <p className="text-sm font-medium text-gray-700">Booking for a child</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Let coaches know you're a parent booking on behalf of a child.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setForm({ ...form, is_parent: !form.is_parent })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_parent ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.is_parent ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    {error}
                </p>
            )}

            {success && (
                <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                    Profile updated successfully.
                </p>
            )}

            <Button onClick={handleSave} loading={saving} className="w-full" size="lg">
                Save Changes
            </Button>
        </div>
    )
}