'use client'

import { X, Calendar, Clock, Dumbbell, DollarSign } from 'lucide-react'

type Session = {
    id: string
    date: string
    start_time: string
    end_time: string
    status: string
    coach_profiles: {
        hourly_rate: number | null
        profiles: { full_name: string | null; avatar_url: string | null }
    }
    profiles: { full_name: string | null; avatar_url: string | null }
}

function getInitials(name: string | null) {
    if (!name) return '?'
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(t: string) {
    const [h, m] = t.split(':')
    const h12 = parseInt(h) % 12 || 12
    return `${h12}:${m} ${parseInt(h) < 12 ? 'AM' : 'PM'}`
}

function formatDateLong(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    })
}

function AvatarBlock({
    url, name, role, roleColor,
}: {
    url: string | null
    name: string | null
    role: string
    roleColor: string
}) {
    return (
        <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 font-bold text-xl flex items-center justify-center border border-blue-100 overflow-hidden">
                {url
                    ? <img src={url} alt={name ?? ''} className="w-full h-full object-cover" />
                    : getInitials(name)
                }
            </div>
            <div className="text-center">
                <p className="text-sm font-semibold text-gray-800">{name ?? 'Unknown'}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColor}`}>
                    {role}
                </span>
            </div>
        </div>
    )
}

export default function SessionPopup({
    session,
    onClose,
}: {
    session: Session | null
    onClose: () => void
}) {
    if (!session) return null

    const coach = session.coach_profiles
    const client = session.profiles
    const rate = coach?.hourly_rate ?? 0

    const [sh, sm] = session.start_time.split(':').map(Number)
    const [eh, em] = session.end_time.split(':').map(Number)
    const mins = (eh * 60 + em) - (sh * 60 + sm)
    const hrs = mins / 60
    const sessionValue = rate * hrs

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                    {/* Header */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-blue-400" />
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Session Details</h2>
                            <p className="text-xs text-gray-400 mt-0.5">ID: {session.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>

                    <div className="p-5 space-y-5">
                        {/* Participants */}
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                Participants
                            </p>
                            <div className="flex items-center gap-4">
                                <AvatarBlock
                                    url={coach?.profiles?.avatar_url ?? null}
                                    name={coach?.profiles?.full_name ?? null}
                                    role="Coach"
                                    roleColor="bg-blue-50 text-blue-600"
                                />

                                {/* VS divider */}
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-px h-6 bg-gray-200" />
                                    <span className="text-xs font-semibold text-gray-300">vs</span>
                                    <div className="w-px h-6 bg-gray-200" />
                                </div>

                                <AvatarBlock
                                    url={client?.avatar_url ?? null}
                                    name={client?.full_name ?? null}
                                    role="Client"
                                    roleColor="bg-purple-50 text-purple-600"
                                />
                            </div>
                        </div>

                        {/* Session info */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                Session Info
                            </p>
                            <div className="rounded-xl border border-gray-100 bg-gray-50 divide-y divide-gray-100">
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-400">Date</p>
                                        <p className="text-sm font-medium text-gray-700">{formatDateLong(session.date)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-400">Time</p>
                                        <p className="text-sm font-medium text-gray-700">
                                            {formatTime(session.start_time)} – {formatTime(session.end_time)}
                                            <span className="ml-2 text-xs text-gray-400">({mins} min)</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <Dumbbell className="w-4 h-4 text-gray-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-400">Status</p>
                                        <span className="text-sm font-medium text-green-600 capitalize">{session.status}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <DollarSign className="w-4 h-4 text-gray-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-400">Session value</p>
                                        <p className="text-sm font-medium text-gray-700">
                                            ${sessionValue.toFixed(2)}
                                            <span className="ml-2 text-xs text-gray-400">(${rate}/hr × {hrs.toFixed(1)} hr)</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}