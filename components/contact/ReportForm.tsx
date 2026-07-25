'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, Check, ChevronDown } from 'lucide-react'
import Button from '@/components/ui/Button'

const REPORTED_TYPES = [
    { value: 'coach', label: 'A Coach' },
    { value: 'user', label: 'A User' },
]

const REASONS = [
    'Inappropriate behaviour',
    'Harassment or bullying',
    'Fraudulent activity',
    'No-show or cancellation issues',
    'Misleading profile information',
    'Payment dispute',
    'Safety concern',
    'Other',
] 

type FormState = {
    reported_type: string
    reported_id: string
    reason: string
    details: string
}

const DEFAULT_FORM: FormState = {
    reported_type: '',
    reported_id: '',
    reason: '',
    details: '',
}

export default function ReportForm({ onSuccess }: { onSuccess?: () => void }) {
    const supabase = createClient()

    const [form, setForm] = useState<FormState>(DEFAULT_FORM)
    const [isAnonymous, setIsAnonymous] = useState(false)
    const [reportingUser, setReportingUser] = useState(true) // whether to link a reported user
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState<Partial<FormState>>({})

    const validate = () => {
        const errors: Partial<FormState> = {}
        if (!form.reason) errors.reason = 'Please select a reason.'
        if (reportingUser && !form.reported_type) errors.reported_type = 'Please select who you are reporting.'
        return errors
    }

    const handleSubmit = async () => {
        setError('')
        const errors = validate()
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            return
        }
        setFieldErrors({})
        setSubmitting(true)

        const { data: { user } } = await supabase.auth.getUser()

        const payload: Record<string, any> = {
            reason: form.reason,
            details: form.details || null,
            status: 'open',
            reporter_id: isAnonymous ? null : (user?.id ?? null),
            reported_id: reportingUser && form.reported_id.trim() ? form.reported_id.trim() : null,
            reported_type: reportingUser && form.reported_type ? form.reported_type : null,
        }

        const { error: insertError } = await supabase.from('reports').insert(payload)

        if (insertError) {
            setError('Failed to submit report. Please try again.')
            setSubmitting(false)
            return
        }

        setSubmitted(true)
        setSubmitting(false)
        setForm(DEFAULT_FORM)

        // On success:
        setSubmitted(true)
        setSubmitting(false)
        setForm(DEFAULT_FORM)
        if (onSuccess) setTimeout(onSuccess, 1500) // close modal after showing success briefly
    }

    if (submitted) {
        return (
            <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto">
                    <Check className="w-7 h-7 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Report submitted</h2>
                <p className="text-sm text-gray-500">
                    Thank you for letting us know. Our team will review your report and take appropriate action.
                </p>
                <button
                    onClick={() => setSubmitted(false)}
                    className="text-sm text-blue-600 hover:underline"
                >
                    Submit another report
                </button>
            </div>
        )
    }

    return (
        <div className="px-5 py-5 space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Report a Problem</h1>
                <p className="text-sm text-gray-400 mt-1">
                    Let us know about any issues, concerns, or problems you've encountered.
                </p>
            </div>

            {/* Anonymous toggle */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-700">Submit anonymously</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Your identity won't be attached to this report.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsAnonymous((v) => !v)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAnonymous ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isAnonymous ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                    </button>
                </div>
            </div>

            {/* Report about a user toggle */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-700">Reporting another user?</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Turn this off if your report is about a general issue.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setReportingUser((v) => !v)
                            setForm((f) => ({ ...f, reported_type: '', reported_id: '' }))
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${reportingUser ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${reportingUser ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                    </button>
                </div>

                {reportingUser && (
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                        {/* Reported type */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">
                                Who are you reporting? <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={form.reported_type}
                                    onChange={(e) => setForm({ ...form, reported_type: e.target.value })}
                                    className="w-full appearance-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-blue-400 focus:outline-none bg-gray-50 pr-8"
                                >
                                    <option value="">Select type…</option>
                                    {REPORTED_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                            {fieldErrors.reported_type && (
                                <p className="text-xs text-red-500">{fieldErrors.reported_type}</p>
                            )}
                        </div>

                        {/* Reported user ID */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">
                                Their name or ID
                                <span className="text-gray-400 font-normal ml-1">(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={form.reported_id}
                                onChange={(e) => setForm({ ...form, reported_id: e.target.value })}
                                placeholder="Enter their name or profile ID if known"
                                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none bg-gray-50"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Reason + details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <p className="text-sm font-semibold text-gray-700">Report Details</p>

                {/* Reason */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                        Reason <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                        <select
                            value={form.reason}
                            onChange={(e) => setForm({ ...form, reason: e.target.value })}
                            className="w-full appearance-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-blue-400 focus:outline-none bg-gray-50 pr-8"
                        >
                            <option value="">Select a reason…</option>
                            {REASONS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {fieldErrors.reason && (
                        <p className="text-xs text-red-500">{fieldErrors.reason}</p>
                    )}
                </div>

                {/* Details */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                        Additional details
                        <span className="text-gray-400 font-normal ml-1">(optional)</span>
                    </label>
                    <textarea
                        value={form.details}
                        onChange={(e) => setForm({ ...form, details: e.target.value })}
                        placeholder="Describe the issue in as much detail as you can…"
                        rows={5}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none resize-none bg-gray-50"
                    />
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            <Button onClick={handleSubmit} loading={submitting} className="w-full" size="lg">
                Submit Report
            </Button>
        </div>
    )
}