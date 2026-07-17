'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { ChevronLeft, Users } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2).toString().padStart(2, '0')
    const minutes = i % 2 === 0 ? '00' : '30'
    const value = `${hours}:${minutes}`
    const hour12 = parseInt(hours) % 12 || 12
    const ampm = parseInt(hours) < 12 ? 'AM' : 'PM'
    const label = `${hour12}:${minutes} ${ampm}`
    return { value, label }
})

type Slot = {
    id?: string
    day_of_week: number
    start_time: string
    end_time: string
    num_clients: number
    notes?: string | null
}

const NOTES_MAX = 200

export default function AvailabilityPage() {
    const router = useRouter()
    const supabase = createClient()

    const [coachId, setCoachId] = useState<string | null>(null)
    const [savedSlots, setSavedSlots] = useState<Slot[]>([])
    const [selectedDay, setSelectedDay] = useState<number>(1)
    const [startTime, setStartTime] = useState('09:00')
    const [endTime, setEndTime] = useState('10:00')
    const [numClients, setNumClients] = useState<number>(1)
    const [notes, setNotes] = useState<string>('')
    const [pendingSlots, setPendingSlots] = useState<Slot[]>([])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [addError, setAddError] = useState('')

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return router.push('/auth/login')
            setCoachId(user.id)

            const { data } = await supabase
                .from('availability')
                .select('*')
                .eq('coach_id', user.id)

            if (data) setSavedSlots(data)
        }
        load()
    }, [])

    const formatTime = (time: string) => {
        const [h, m] = time.split(':')
        const hour12 = parseInt(h) % 12 || 12
        const ampm = parseInt(h) < 12 ? 'AM' : 'PM'
        return `${hour12}:${m} ${ampm}`
    }

    const handleAddSlot = () => {
        setAddError('')

        if (startTime >= endTime) {
            setAddError('End time must be after start time.')
            return
        }

        const duplicate = [...savedSlots, ...pendingSlots].some(
            (s) => s.day_of_week === selectedDay && s.start_time === startTime && s.end_time === endTime
        )
        if (duplicate) {
            setAddError('This slot already exists.')
            return
        }

        if (numClients <= 0) {
            setAddError('Too few clients selected.')
            return
        }

        setPendingSlots((prev) => [
            ...prev,
            {
                day_of_week: selectedDay,
                start_time: startTime,
                end_time: endTime,
                num_clients: numClients,
                notes: notes.trim() || null,
            },
        ])
        setNotes('')
    }

    const removePendingSlot = (index: number) => {
        setPendingSlots((prev) => prev.filter((_, i) => i !== index))
    }

    const removeSavedSlot = (index: number) => {
        setSavedSlots((prev) => prev.filter((_, i) => i !== index))
    }

    const handleSave = async () => {
        if (!coachId) return
        setSaving(true)
        setError('')

        const { error: deleteError } = await supabase
            .from('availability')
            .delete()
            .eq('coach_id', coachId)

        if (deleteError) {
            setError('Failed to update. Please try again.')
            setSaving(false)
            return
        }

        const allSlots = [...savedSlots, ...pendingSlots].map((s) => ({
            coach_id: coachId,
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
            num_clients: s.num_clients ?? 1,
            notes: s.notes ?? null,
        }))

        if (allSlots.length > 0) {
            const { error: insertError } = await supabase.from('availability').insert(allSlots)
            if (insertError) {
                console.log(insertError.message)
                setError('Failed to save. Please try again.')
                setSaving(false)
                return
            }
        }

        router.push('/dashboard/coach')
    }

    const groupByDay = (slots: Slot[]) =>
        slots.reduce<Record<number, Slot[]>>((acc, slot) => {
            if (!acc[slot.day_of_week]) acc[slot.day_of_week] = []
            acc[slot.day_of_week].push(slot)
            return acc
        }, {})

    const allSlots = [...savedSlots, ...pendingSlots]
    const grouped = groupByDay(allSlots)
    const pendingGrouped = groupByDay(pendingSlots)

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-xl mx-auto px-4 py-10 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Set Your Availability</h1>
                <p className="text-sm text-gray-500 mt-1">Add time slots for when you&apos;re available to coach.</p>
            </div>
            
            {/* Add slot form */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Add a Slot</h2>
                <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600 font-medium">Maximum Group Size</label>
                        <input
                            type="number"
                            min={1}
                            max={20}
                            value={numClients}
                            onChange={(e) => setNumClients(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600 font-medium">Day</label>
                        <select
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none"
                        >
                            {DAYS.map((day, i) => (
                                <option key={i} value={i}>{day}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-gray-600 font-medium">Start Time</label>
                            <select
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none"
                            >
                                {TIME_OPTIONS.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-gray-600 font-medium">End Time</label>
                            <select
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none"
                            >
                                {TIME_OPTIONS.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600 font-medium">
                            Notes <span className="text-xs text-gray-400 font-normal">(optional, visible to clients)</span>
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX))}
                            rows={2}
                            maxLength={NOTES_MAX}
                            placeholder="e.g. Beach session — bring water and a towel."
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none resize-none"
                        />
                        <div className="flex justify-end">
                            <span className={`text-xs ${notes.length >= NOTES_MAX ? 'text-red-500' : 'text-gray-400'}`}>
                                {notes.length} / {NOTES_MAX}
                            </span>
                        </div>
                    </div>
                </div>

                {addError && <p className="text-xs text-red-500">{addError}</p>}

                <button
                    type="button"
                    onClick={handleAddSlot}
                    className="w-full rounded-lg border-2 border-dashed border-blue-300 py-2 text-sm font-medium text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                    + Add Slot
                </button>
            </div>

            {/* Current slots */}
            {Object.keys(grouped).length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Your Slots</h2>

                    {DAYS.map((dayName, day) => {
                        if (!grouped[day]) return null
                        return (
                            <div key={day} className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
                                <div className="px-4 py-2 bg-gray-100 border-b border-gray-200">
                                    <span className="text-sm font-semibold text-gray-700">{dayName}</span>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {grouped[day]
                                        .sort((a, b) => a.start_time.localeCompare(b.start_time))
                                        .map((slot, i) => {
                                            const isPending = pendingGrouped[day]?.some(
                                                (s) => s.start_time === slot.start_time && s.end_time === slot.end_time
                                            )

                                            return (
                                                <div key={i} className="flex items-start justify-between gap-3 px-4 py-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <span className="text-sm text-gray-700">
                                                                {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                                                            </span>

                                                            {/* Client capacity badge */}
                                                            <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                                                                <Users className="w-3 h-3 text-gray-400" />
                                                                {slot.num_clients ?? 1} client{(slot.num_clients ?? 1) !== 1 ? 's' : ''}
                                                            </span>

                                                            {isPending && (
                                                                <span className="text-xs bg-blue-100 text-blue-600 font-medium px-2 py-0.5 rounded-full">
                                                                    New
                                                                </span>
                                                            )}
                                                        </div>
                                                        {slot.notes && (
                                                            <p className="mt-1 text-xs text-gray-500 break-words whitespace-pre-line">
                                                                {slot.notes}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (isPending) {
                                                                const idx = pendingSlots.findIndex(
                                                                    (s) => s.day_of_week === day && s.start_time === slot.start_time && s.end_time === slot.end_time
                                                                )
                                                                removePendingSlot(idx)
                                                            } else {
                                                                const idx = savedSlots.findIndex(
                                                                    (s) => s.day_of_week === day && s.start_time === slot.start_time && s.end_time === slot.end_time
                                                                )
                                                                removeSavedSlot(idx)
                                                            }
                                                        }}
                                                        className="text-gray-300 hover:text-red-400 text-lg leading-none transition-colors flex-shrink-0"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            )
                                        })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
            
            <Button onClick={handleSave} loading={saving} className="w-full" size="lg">
                Save & Continue
            </Button>
            <Link
                href="/dashboard/coach"
                className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to dashboard
            </Link>
            </div>
        </div>
    )
}