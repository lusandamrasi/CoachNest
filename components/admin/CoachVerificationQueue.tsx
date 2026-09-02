'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, ChevronDown, Check, AlertCircle, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

type VerificationStatus = 'pending' | 'id_verified' | 'qualification_verified' | 'verified'

type QueueCoach = {
  id: string
  full_name: string | null
  email: string | null
  sport: string | null
  verification_status: VerificationStatus
  id_document_url: string | null
  qualifications_url: string[] | null
  created_at: string | null
  avatar_url: string | null
}

type PendingAction =
  | { kind: 'view-id'; coach: QueueCoach }
  | { kind: 'view-qual'; coach: QueueCoach; path: string; index: number }
  | { kind: 'verify'; coach: QueueCoach }

type Toast = { kind: 'success' | 'error'; message: string } | null

// pending/id_verified/qualification_verified can still appear here from
// historical data — the admin UI only ever sets 'verified' now, but the
// badge should still render whatever status a coach's row actually has.
const STATUS_BADGE: Record<VerificationStatus, { label: string; variant: 'gray' | 'blue' | 'green' }> = {
  pending: { label: 'Pending', variant: 'gray' },
  id_verified: { label: 'ID Verified', variant: 'blue' },
  qualification_verified: { label: 'Qualification Verified', variant: 'blue' },
  verified: { label: 'Fully Verified', variant: 'green' },
}

function initials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onOutside])
  return ref
}

function QualificationsMenu({
  coach,
  disabled,
  onSelect,
}: {
  coach: QueueCoach
  disabled: boolean
  onSelect: (path: string, index: number) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useClickOutside(() => setOpen(false))
  const quals = coach.qualifications_url ?? []

  if (quals.length <= 1) {
    return (
      <button
        type="button"
        disabled={disabled}
        title={disabled ? 'No qualifications uploaded' : undefined}
        onClick={() => quals[0] && onSelect(quals[0], 0)}
        className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        View Qualifications
      </button>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50"
      >
        View Qualifications
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
          {quals.map((path, i) => (
            <button
              key={path}
              type="button"
              onClick={() => {
                setOpen(false)
                onSelect(path, i)
              }}
              className="block w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
            >
              Qualification {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CoachVerificationQueue({
  onCountChange,
}: {
  onCountChange?: (count: number) => void
}) {
  const [coaches, setCoaches] = useState<QueueCoach[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast>(null)

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/coaches-pending')
      if (!res.ok) throw new Error('Failed to load verification queue')
      const data = await res.json()
      setCoaches(data)
      setLoadError(null)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load verification queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  useEffect(() => {
    onCountChange?.(coaches.length)
  }, [coaches.length, onCountChange])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('coach-profiles-verification-queue')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'coach_profiles' },
        () => fetchQueue(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchQueue])

  function showToast(t: Toast) {
    setToast(t)
    if (t) setTimeout(() => setToast(null), 3500)
  }

  async function handleConfirm() {
    if (!pendingAction) return
    setConfirmLoading(true)
    setConfirmError(null)

    try {
      if (pendingAction.kind === 'view-id' || pendingAction.kind === 'view-qual') {
        const filePath = pendingAction.kind === 'view-id' ? pendingAction.coach.id_document_url : pendingAction.path
        const res = await fetch('/api/admin/document-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath, bucket: 'coach-documents' }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to generate document link')
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
        setPendingAction(null)
      } else {
        const { coach } = pendingAction
        const res = await fetch('/api/admin/verify-coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coachId: coach.id, newStatus: 'verified' }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to update verification status')

        showToast({ kind: 'success', message: `${coach.full_name ?? 'Coach'} marked as Fully Verified` })

        // verify-coach sends the status email itself now (with an auth.users
        // email fallback this client doesn't have data for), so no client-side
        // email call here — avoids sending the coach a duplicate email.

        setCoaches((prev) => prev.filter((c) => c.id !== coach.id))
        setPendingAction(null)
      }
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setConfirmLoading(false)
    }
  }

  function confirmCopy(action: PendingAction): { title: string; message: string; confirmLabel: string } {
    if (action.kind === 'view-id') {
      return {
        title: 'Download ID Document',
        message: `Download ID document for ${action.coach.full_name ?? 'this coach'}?`,
        confirmLabel: 'Yes',
      }
    }
    if (action.kind === 'view-qual') {
      return {
        title: 'Download Qualification',
        message: `Download qualification ${action.index + 1} for ${action.coach.full_name ?? 'this coach'}?`,
        confirmLabel: 'Yes',
      }
    }
    return {
      title: 'Verify Coach',
      message: `Verify ${action.coach.full_name ?? 'this coach'} as a Fully Verified Coach?`,
      confirmLabel: 'Yes',
    }
  }

  return (
    <div className="space-y-4">
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

      <div className="flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Coaches Pending Verification</h2>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
          {coaches.length}
        </span>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading…</div>
      ) : loadError ? (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          <AlertCircle className="h-4 w-4" />
          {loadError}
        </div>
      ) : coaches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-green-500" />
          <p className="mt-2 font-medium text-gray-600">No coaches awaiting verification</p>
        </div>
      ) : (
        <div className="space-y-4">
          {coaches.map((coach) => {
            const statusBadge = STATUS_BADGE[coach.verification_status] ?? STATUS_BADGE.pending
            return (
              <div key={coach.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-blue-100 bg-blue-50 text-sm font-bold text-blue-600">
                    {coach.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={coach.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials(coach.full_name)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900">{coach.full_name ?? 'Unnamed'}</p>
                      <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                    </div>
                    <p className="text-xs text-gray-400">
                      {coach.sport ?? 'Coach'} · {coach.email ?? 'No email'}
                    </p>
                    <p className="text-xs text-gray-400">Coach ID: {coach.id.slice(0, 8)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!coach.id_document_url}
                    title={!coach.id_document_url ? 'No ID uploaded' : undefined}
                    onClick={() => setPendingAction({ kind: 'view-id', coach })}
                    className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    View ID Document
                  </button>

                  <QualificationsMenu
                    coach={coach}
                    disabled={(coach.qualifications_url ?? []).length === 0}
                    onSelect={(path, index) => setPendingAction({ kind: 'view-qual', coach, path, index })}
                  />

                  <button
                    type="button"
                    onClick={() => setPendingAction({ kind: 'verify', coach })}
                    className="ml-auto rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Verify Coach
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingAction !== null}
        title={pendingAction ? confirmCopy(pendingAction).title : ''}
        message={pendingAction ? confirmCopy(pendingAction).message : ''}
        confirmLabel={pendingAction ? confirmCopy(pendingAction).confirmLabel : 'Yes'}
        loading={confirmLoading}
        error={confirmError}
        onConfirm={handleConfirm}
        onCancel={() => {
          setPendingAction(null)
          setConfirmError(null)
        }}
      />
    </div>
  )
}
