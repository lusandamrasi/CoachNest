'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Users, Flag, ChevronDown, ChevronUp, Check,
    Clock, AlertCircle, Shield, User, Dumbbell, CalendarCheck,
    type LucideIcon,
} from 'lucide-react'
import SessionPopup from './SessionPopUp'
import UserPopup from './UserPopUp'

type Profile = {
    id: string
    full_name: string | null
    avatar_url: string | null
    role: string | null
    created_at: string
}

type Report = {
    id: string
    reason: string
    details: string | null
    status: 'open' | 'reviewed' | 'resolved'
    created_at: string
    reported_type: 'coach' | 'user'
    reporter: { id: string; full_name: string | null; avatar_url: string | null } | null
    reported: { id: string; full_name: string | null; avatar_url: string | null } | null
}

type Session = {
    id: string
    date: string
    start_time: string
    end_time: string
    status: 'completed' | 'completed-unpaid'
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

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    })
}

const STATUS_CONFIG = {
    open: {
        label: 'Open',
        icon: AlertCircle,
        className: 'bg-red-50 text-red-600 border-red-100',
        iconClass: 'text-red-400',
    },
    reviewed: {
        label: 'Reviewed',
        icon: Clock,
        className: 'bg-amber-50 text-amber-600 border-amber-100',
        iconClass: 'text-amber-400',
    },
    resolved: {
        label: 'Resolved',
        icon: Check,
        className: 'bg-green-50 text-green-600 border-green-100',
        iconClass: 'text-green-400',
    },
}

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
    coach: { label: 'Coach', className: 'bg-blue-50 text-blue-600' },
    client: { label: 'Client', className: 'bg-purple-50 text-purple-600' },
    admin: { label: 'Admin', className: 'bg-gray-100 text-gray-600' },
}


type Tab = 'users' | 'reports' | 'sessions'
type ReportFilter = 'all' | 'open' | 'reviewed' | 'resolved'
type UserFilter = 'all' | 'coach' | 'client' | 'admin'

function Avatar({
    url, name, size = 'sm',
}: {
    url: string | null; name: string | null; size?: 'sm' | 'md'
}) {
    const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
    return (
        <div className={`${dim} rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center border border-blue-100 shrink-0 overflow-hidden`}>
            {url
                ? <img src={url} alt={name ?? ''} className="w-full h-full object-cover" />
                : getInitials(name)
            }
        </div>
    )
}

function ReportCard({ report, onStatusChange }: {
    report: Report
    onStatusChange: (id: string, status: Report['status']) => void
}) {
    const [expanded, setExpanded] = useState(false)
    const [updating, setUpdating] = useState(false)
    const status = STATUS_CONFIG[report.status]
    const StatusIcon = status.icon

    const handleStatus = async (newStatus: Report['status']) => {
        setUpdating(true)
        await onStatusChange(report.id, newStatus)
        setUpdating(false)
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${status.className}`}>
                            <StatusIcon className={`w-3 h-3 ${status.iconClass}`} />
                            {status.label}
                        </span>
                        <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${report.reported_type === 'coach'
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-purple-50 text-purple-600'
                            }`}>
                            {report.reported_type === 'coach'
                                ? <Dumbbell className="w-3 h-3" />
                                : <User className="w-3 h-3" />
                            }
                            {report.reported_type}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(report.created_at)}</span>
                    </div>
                    <button
                        onClick={() => setExpanded((v) => !v)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>

                {/* Reporter / Reported */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-1">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Reporter</p>
                        <div className="flex items-center gap-2">
                            <Avatar url={report.reporter?.avatar_url ?? null} name={report.reporter?.full_name ?? null} />
                            <p className="text-sm font-medium text-gray-700 truncate">
                                {report.reporter?.full_name ?? 'Deleted user'}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-1">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Reported</p>
                        <div className="flex items-center gap-2">
                            <Avatar url={report.reported?.avatar_url ?? null} name={report.reported?.full_name ?? null} />
                            <p className="text-sm font-medium text-gray-700 truncate">
                                {report.reported?.full_name ?? 'Deleted user'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Reason */}
                <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Reason</p>
                    <p className="text-sm text-gray-700">{report.reason}</p>
                </div>

                {/* Details (expanded) */}
                {expanded && report.details && (
                    <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Details</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{report.details}</p>
                    </div>
                )}

                {/* Status actions */}
                <div className="flex gap-2 pt-1 border-t border-gray-50">
                    {(['open', 'reviewed', 'resolved'] as Report['status'][])
                        .filter((s) => s !== report.status)
                        .map((s) => (
                            <button
                                key={s}
                                onClick={() => handleStatus(s)}
                                disabled={updating}
                                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-50 ${s === 'resolved'
                                        ? 'bg-green-50 border-green-100 text-green-600 hover:bg-green-100'
                                        : s === 'reviewed'
                                            ? 'bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100'
                                            : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100'
                                    }`}
                            >
                                Mark {s}
                            </button>
                        ))}
                </div>
            </div>
        </div>
    )
}

function UserRow({ user, onClick }: { user: Profile; onClick: () => void }) {
    const role = ROLE_CONFIG[user.role ?? ''] ?? {
        label: user.role ?? 'Unknown',
        className: 'bg-gray-100 text-gray-500',
    }

    return (
        <div
            onClick={onClick}
            className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
        >            
            <div className="flex items-center gap-3">
                <Avatar url={user.avatar_url} name={user.full_name} size="md" />
                <div>
                    <p className="text-sm font-medium text-gray-800">{user.full_name ?? 'Unnamed'}</p>
                    <p className="text-xs text-gray-400">Joined {formatDate(user.created_at)}</p>
                </div>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${role.className}`}>
                {role.label}
            </span>
        </div>
    )
}

export default function AdminDashboardClient({
    users: initialUsers,
    reports: initialReports,
    sessions: initialSessions,
}: {
    users: Profile[]
    reports: Report[]
    sessions: Session[]
}) {
    const supabase = createClient()

    const [tab, setTab] = useState<Tab>('users')
    const [reports, setReports] = useState<Report[]>(initialReports)
    const [reportFilter, setReportFilter] = useState<ReportFilter>('open')
    const [userFilter, setUserFilter] = useState<UserFilter>('all')
    const [userSearch, setUserSearch] = useState('')
    const [payingId, setPayingId] = useState<string | null>(null)
    const [paidIds, setPaidIds] = useState<Set<string>>(new Set())
    const [activeSession, setActiveSession] = useState<Session | null>(null)
    const [activeUser, setActiveUser] = useState<Profile | null>(null)


    const handleStatusChange = async (id: string, status: Report['status']) => {
        const { error } = await supabase
            .from('reports')
            .update({ status })
            .eq('id', id)

        if (!error) {
            setReports((prev) => prev.map((r) => r.id === id ? { ...r, status } : r))
        }
    }

    const handlePay = async (session: Session) => {
        setPayingId(session.id)
        await new Promise((r) => setTimeout(r, 1500))
        setPaidIds((prev) => new Set([...prev, session.id]))
        setPayingId(null)
    }

    const filteredReports = reports.filter((r) =>
        reportFilter === 'all' ? true : r.status === reportFilter
    )

    const filteredUsers = initialUsers.filter((u) => {
        const matchesRole = userFilter === 'all' || u.role === userFilter
        const matchesSearch = !userSearch ||
            u.full_name?.toLowerCase().includes(userSearch.toLowerCase())
        return matchesRole && matchesSearch
    })

    const sessionsByCoach = initialSessions.reduce<Record<string, Session[]>>((acc, s) => {
        const name = s.coach_profiles?.profiles?.full_name ?? 'Unknown'
        if (!acc[name]) acc[name] = []
        acc[name].push(s)
        return acc
    }, {})

    const openCount = reports.filter((r) => r.status === 'open').length
    const totalCoaches = initialUsers.filter((u) => u.role === 'coach').length
    const totalClients = initialUsers.filter((u) => u.role === 'client').length

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-sm text-gray-400">Manage users, reports, and sessions.</p>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Users', value: initialUsers.length, color: 'text-gray-700', bg: 'bg-white' },
                        { label: 'Coaches', value: totalCoaches, color: 'text-blue-700', bg: 'bg-blue-50' },
                        { label: 'Clients', value: totalClients, color: 'text-purple-700', bg: 'bg-purple-50' },
                        { label: 'Open Reports', value: openCount, color: 'text-red-700', bg: 'bg-red-50' },
                    ].map(({ label, value, color, bg }) => (
                        <div key={label} className={`${bg} rounded-2xl border border-gray-100 shadow-sm px-5 py-4`}>
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
                            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 flex-wrap">
                    {([
                        { key: 'users', label: 'Users', icon: Users, count: initialUsers.length },
                        { key: 'reports', label: 'Reports', icon: Flag, count: openCount },
                        { key: 'sessions', label: 'Sessions', icon: CalendarCheck, count: initialSessions.length },
                    ] as { key: Tab; label: string; icon: LucideIcon; count: number }[]).map(({ key, label, icon: Icon, count }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === key
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ── Reports tab ── */}
                {tab === 'reports' && (
                    <div className="space-y-4">
                        <div className="flex gap-2 flex-wrap">
                            {(['all', 'open', 'reviewed', 'resolved'] as ReportFilter[]).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setReportFilter(f)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${reportFilter === f
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        {filteredReports.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                <Flag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="font-medium text-gray-500">No {reportFilter} reports</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredReports.map((report) => (
                                    <ReportCard
                                        key={report.id}
                                        report={report}
                                        onStatusChange={handleStatusChange}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Users tab ── */}
                {tab === 'users' && (
                    <div className="space-y-4">
                        <div className="flex gap-3 flex-wrap">
                            <input
                                type="text"
                                placeholder="Search by name…"
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="flex-1 min-w-48 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 bg-white"
                            />
                            <div className="flex gap-2 flex-wrap">
                                {(['all', 'coach', 'client', 'admin'] as UserFilter[]).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setUserFilter(f)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${userFilter === f
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 px-2">
                            {filteredUsers.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="font-medium text-gray-500">No users found</p>
                                </div>
                            ) : (
                                filteredUsers.map((user) => (
                                    <UserRow key={user.id} user={user} onClick={() => setActiveUser(user)} />
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* ── Sessions tab ── */}
                {tab === 'sessions' && (
                    <div className="space-y-6">
                        <p className="text-sm text-gray-400">
                            Confirmed sessions grouped by coach. Pay out coaches for completed sessions.
                        </p>

                        {Object.keys(sessionsByCoach).length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                <CalendarCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="font-medium text-gray-500">No confirmed sessions yet</p>
                            </div>
                        ) : (
                            Object.entries(sessionsByCoach).map(([coachName, coachSessions]) => {
                                const coach = coachSessions[0].coach_profiles
                                const rate = coach?.hourly_rate ?? 0

                                const totalOwed = coachSessions.reduce((sum, s) => {
                                    if (paidIds.has(s.id)) return sum
                                    const [sh, sm] = s.start_time.split(':').map(Number)
                                    const [eh, em] = s.end_time.split(':').map(Number)
                                    const hrs = ((eh * 60 + em) - (sh * 60 + sm)) / 60
                                    return sum + rate * hrs
                                }, 0)

                                const allPaid = coachSessions.every((s) => paidIds.has(s.id))

                                return (
                                    <div key={coachName} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                        {/* Coach header */}
                                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm flex items-center justify-center border border-blue-100 overflow-hidden">
                                                    {coach?.profiles?.avatar_url
                                                        ? <img src={coach.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        : getInitials(coach?.profiles?.full_name ?? null)
                                                    }
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{coachName}</p>
                                                    <p className="text-xs text-gray-400">
                                                        R{rate}/hr · {coachSessions.length} session{coachSessions.length !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400">Outstanding</p>
                                                <p className={`text-lg font-bold ${allPaid ? 'text-green-600' : 'text-gray-900'}`}>
                                                    {allPaid ? 'All paid ✓' : `R${totalOwed.toFixed(2)}`}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Sessions list */}
                                        <div className="divide-y divide-gray-50">
                                            {coachSessions.map((session) => {
                                                const [sh, sm] = session.start_time.split(':').map(Number)
                                                const [eh, em] = session.end_time.split(':').map(Number)
                                                const mins = (eh * 60 + em) - (sh * 60 + sm)
                                                const hrs = mins / 60
                                                const amount = rate * hrs
                                                const isPaid = paidIds.has(session.id)
                                                const isPayingThis = payingId === session.id

                                                return (
                                                    <div
                                                        key={session.id}
                                                        onClick={() => setActiveSession(session)}
                                                        className="flex items-center justify-between px-5 py-3 gap-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            {/* Status badge */}
                                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${session.status === 'completed'
                                                                    ? 'bg-green-50 text-green-600'
                                                                    : 'bg-orange-50 text-orange-600'
                                                                }`}>
                                                                {session.status === 'completed' ? 'Paid' : 'Unpaid'}
                                                            </span>

                                                            <span className="text-sm font-semibold text-gray-700">
                                                                R{amount.toFixed(2)}
                                                            </span>

                                                            {isPaid ? (
                                                                <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-xl">
                                                                    <Check className="w-3 h-3" /> Paid
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handlePay(session)}
                                                                    disabled={!!payingId}
                                                                    className="flex items-center gap-1.5 text-xs font-semibold text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-50 px-3 py-1.5 rounded-xl transition-colors"
                                                                >
                                                                    {isPayingThis ? 'Processing…' : 'Pay coach'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                )}
            </div>
            <SessionPopup session={activeSession} onClose={() => setActiveSession(null)} />
            <UserPopup user={activeUser} onClose={() => setActiveUser(null)} />

        </div>
    )
}