'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

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
}

export default function AvailabilityPage() {
    const router = useRouter()
    const supabase = createClient()

    const [coachId, setCoachId] = useState<string | null>(null)
    const [savedSlots, setSavedSlots] = useState<Slot[]>([])
    const [selectedDay, setSelectedDay] = useState<number>(1)
    const [startTime, setStartTime] = useState('09:00')
    const [endTime, setEndTime] = useState('10:00')
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
                .order('day_of_week')

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

        setPendingSlots((prev) => [...prev, { day_of_week: selectedDay, start_time: startTime, end_time: endTime }])
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
        }))

        if (allSlots.length > 0) {
            const { error: insertError } = await supabase.from('availability').insert(allSlots)
            if (insertError) {
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
    const savedGrouped = groupByDay(savedSlots)
    const pendingGrouped = groupByDay(pendingSlots)

    return (
        <div className="max-w-xl mx-auto px-4 py-10 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Set Your Availability</h1>
                <p className="text-sm text-gray-500 mt-1">Add time slots for when you're available to coach.</p>
            </div>
            
            {/* Add slot form */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Add a Slot</h2>

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
                                            const isSaved = savedGrouped[day]?.some(
                                                (s) => s.start_time === slot.start_time && s.end_time === slot.end_time
                                            )
                                            const isPending = pendingGrouped[day]?.some(
                                                (s) => s.start_time === slot.start_time && s.end_time === slot.end_time
                                            )

                                            return (
                                                <div key={i} className="flex items-center justify-between px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm text-gray-700">
                                                            {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                                                        </span>
                                                        {isPending && (
                                                            <span className="text-xs bg-blue-100 text-blue-600 font-medium px-2 py-0.5 rounded-full">
                                                                New
                                                            </span>
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
                                                        className="text-gray-300 hover:text-red-400 text-lg leading-none transition-colors"
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
    )
}