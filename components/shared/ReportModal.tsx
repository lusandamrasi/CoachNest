'use client'

import { useEffect, useState } from 'react'
import { X, AlertCircle, ShieldAlert, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

type ReportedType = 'coach' | 'user'

interface ReportModalProps {
  reportedId: string
  reportedType: ReportedType
  isOpen: boolean
  onClose: () => void
}

const REASONS: Record<ReportedType, string[]> = {
  coach: [
    'Inappropriate Behaviour',
    'Fake Qualifications',
    'Harassment',
    'Child Safety Concern',
    'Other',
  ],
  user: ['Harassment', 'Abuse', 'Spam', 'Other'],
}

export default function ReportModal({
  reportedId,
  reportedType,
  isOpen,
  onClose,
}: ReportModalProps) {
  const reasons = REASONS[reportedType]
  const [reason, setReason] = useState(reasons[0])
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setReason(reasons[0])
      setDetails('')
      setError(null)
      setSuccess(false)
    }
  }, [isOpen, reasons])

  useEffect(() => {
    if (!isOpen) return
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSubmitting(false)
      setError('You must be signed in to submit a report.')
      return
    }

    const { error: insertErr } = await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_id: reportedId,
      reported_type: reportedType,
      reason,
      details: details.trim() || null,
    })

    setSubmitting(false)

    if (insertErr) {
      setError(`Could not submit report: ${insertErr.message}`)
      return
    }

    setSuccess(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Report {reportedType === 'coach' ? 'coach' : 'user'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="mt-6 flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
              <Check className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm text-gray-700">
              Report submitted. Thank you — we take all reports seriously.
            </p>
            <Button type="button" variant="outline" size="sm" className="mt-5" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="report_reason" className="text-sm font-medium text-gray-700">
                Reason
              </label>
              <select
                id="report_reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="report_details" className="text-sm font-medium text-gray-700">
                Details (optional)
              </label>
              <textarea
                id="report_details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                placeholder="Add any additional context that would help us review this report."
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={submitting}>
                Submit Report
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
