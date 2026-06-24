'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, AlertCircle, UploadCloud, FileText, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

type VerificationStatus =
  | 'unverified'
  | 'pending'
  | 'id_verified'
  | 'qualification_verified'
  | 'verified'

const STATUS_STEPS: { key: VerificationStatus; label: string; color: string }[] = [
  { key: 'pending', label: 'Pending', color: 'bg-gray-200 text-gray-700' },
  { key: 'id_verified', label: 'ID Verified', color: 'bg-blue-100 text-blue-700' },
  { key: 'qualification_verified', label: 'Qualification Verified', color: 'bg-blue-100 text-blue-700' },
  { key: 'verified', label: 'Verified Coach', color: 'bg-green-100 text-green-700' },
]

const ID_ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png']
const QUAL_ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png']
const DOC_MAX_BYTES = 10 * 1024 * 1024

interface VerificationFormProps {
  userId: string
  initial: {
    id_document_url: string | null
    qualifications_url: string[] | null
    declaration_accepted: boolean
    verification_status: VerificationStatus
  }
}

type Toast = { kind: 'success' | 'error'; message: string } | null

function filenameFromUrl(url: string) {
  try {
    const u = new URL(url)
    return decodeURIComponent(u.pathname.split('/').pop() ?? 'document')
  } catch {
    return url.split('/').pop() ?? 'document'
  }
}

export default function VerificationForm({ userId, initial }: VerificationFormProps) {
  const router = useRouter()

  const [idDocUrl, setIdDocUrl] = useState<string | null>(initial.id_document_url)
  const [qualUrls, setQualUrls] = useState<string[]>(initial.qualifications_url ?? [])
  const [declarationAccepted, setDeclarationAccepted] = useState(initial.declaration_accepted)
  const [status, setStatus] = useState<VerificationStatus>(initial.verification_status)

  const [locked, setLocked] = useState(
    initial.declaration_accepted && initial.verification_status !== 'unverified',
  )

  const [submitting, setSubmitting] = useState(false)
  const [uploadingId, setUploadingId] = useState(false)
  const [uploadingQual, setUploadingQual] = useState(false)
  const [toast, setToast] = useState<Toast>(null)
  const [error, setError] = useState<string | null>(null)

  const idInputRef = useRef<HTMLInputElement>(null)
  const qualInputRef = useRef<HTMLInputElement>(null)

  function showToast(t: Toast) {
    setToast(t)
    if (t) setTimeout(() => setToast(null), 3500)
  }

  async function uploadPrivate(file: File, path: string): Promise<string | null> {
    const supabase = createClient()
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
    if (sessionErr || !sessionData.session) {
      setError('Your session expired. Please sign in again.')
      return null
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const endpoint = `${supabaseUrl}/storage/v1/object/coach-documents/${path}`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
        'Content-Type': file.type,
        'x-upsert': 'true',
      },
      body: file,
    })
    if (!res.ok) {
      const text = await res.text()
      setError(`Upload failed (${res.status}). ${text}`)
      return null
    }
    return path
  }

  async function handleIdFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!ID_ACCEPTED.includes(file.type)) {
      setError('ID must be a PDF, JPG, or PNG.')
      return
    }
    if (file.size > DOC_MAX_BYTES) {
      setError('ID file must be 10MB or smaller.')
      return
    }

    setUploadingId(true)
    const ext = file.name.split('.').pop() ?? 'pdf'
    const path = `${userId}/id.${ext}`
    const result = await uploadPrivate(file, path)
    if (result) setIdDocUrl(path)
    setUploadingId(false)
  }

  async function handleQualFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    setUploadingQual(true)
    const newPaths: string[] = []
    for (const file of files) {
      if (!QUAL_ACCEPTED.includes(file.type)) {
        setError('Qualifications must be PDF, JPG, or PNG.')
        continue
      }
      if (file.size > DOC_MAX_BYTES) {
        setError('Each qualification must be 10MB or smaller.')
        continue
      }
      const ext = file.name.split('.').pop() ?? 'pdf'
      const n = qualUrls.length + newPaths.length + 1
      const path = `${userId}/qual_${n}_${Date.now()}.${ext}`
      const result = await uploadPrivate(file, path)
      if (result) newPaths.push(path)
    }
    if (newPaths.length > 0) setQualUrls([...qualUrls, ...newPaths])
    setUploadingQual(false)
  }

  function removeQual(path: string) {
    setQualUrls(qualUrls.filter((p) => p !== path))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!declarationAccepted) {
      setError('You must accept the declaration to submit.')
      return
    }
    if (!idDocUrl) {
      setError('Please upload your SA ID or Passport.')
      return
    }

    setSubmitting(true)
    const supabase = createClient()
    const now = new Date().toISOString()

    const { error: updErr } = await supabase
      .from('coach_profiles')
      .update({
        id_document_url: idDocUrl,
        qualifications_url: qualUrls,
        declaration_accepted: true,
        declaration_accepted_at: now,
        verification_status: 'pending',
      })
      .eq('id', userId)

    setSubmitting(false)

    if (updErr) {
      setError(`Submission failed: ${updErr.message}`)
      return
    }

    setStatus('pending')
    setLocked(true)
    showToast({
      kind: 'success',
      message: 'Documents submitted. The CoachNest team will review within 3–5 business days.',
    })
    router.refresh()
  }

  const statusIndex = STATUS_STEPS.findIndex((s) => s.key === status)
  const canSubmit = declarationAccepted && !!idDocUrl && !submitting

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Status row */}
      <Card padding="lg">
        <div className="flex items-center gap-2 text-blue-600">
          <ShieldCheck className="h-5 w-5" />
          <h2 className="text-lg font-semibold text-gray-900">Verification Status</h2>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3">
          {STATUS_STEPS.map((step, i) => {
            const isActive = step.key === status
            const isReached = statusIndex >= i && statusIndex >= 0
            return (
              <div key={step.key} className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    isActive
                      ? step.color
                      : isReached
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-gray-50 text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
                {i < STATUS_STEPS.length - 1 && (
                  <span className="text-gray-300">→</span>
                )}
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Documents are reviewed manually by the CoachNest team within 3–5 business days.
        </p>
      </Card>

      {/* Uploads */}
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-gray-900">SA ID or Passport</h2>
        <p className="mt-1 text-sm text-gray-500">PDF, JPG, or PNG. Max 10MB.</p>

        <div className="mt-4">
          {idDocUrl ? (
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <Check className="h-4 w-4 text-green-600" />
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="flex-1 truncate text-sm text-gray-700">
                {filenameFromUrl(idDocUrl)}
              </span>
              {!locked && (
                <button
                  type="button"
                  onClick={() => idInputRef.current?.click()}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Replace
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => idInputRef.current?.click()}
              disabled={uploadingId || locked}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-6 text-sm text-gray-600 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50"
            >
              <UploadCloud className="h-5 w-5" />
              {uploadingId ? 'Uploading…' : 'Upload ID or Passport'}
            </button>
          )}

          <input
            ref={idInputRef}
            type="file"
            accept={ID_ACCEPTED.join(',')}
            onChange={handleIdFile}
            className="hidden"
          />
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-lg font-semibold text-gray-900">Qualifications & Certificates</h2>
        <p className="mt-1 text-sm text-gray-500">PDF, JPG, or PNG. Max 10MB each.</p>

        <div className="mt-4 space-y-2">
          {qualUrls.map((path) => (
            <div
              key={path}
              className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3"
            >
              <Check className="h-4 w-4 text-green-600" />
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="flex-1 truncate text-sm text-gray-700">{filenameFromUrl(path)}</span>
              {!locked && (
                <button
                  type="button"
                  onClick={() => removeQual(path)}
                  className="text-xs font-medium text-gray-500 hover:text-red-500"
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          {!locked && (
            <button
              type="button"
              onClick={() => qualInputRef.current?.click()}
              disabled={uploadingQual}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-6 text-sm text-gray-600 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50"
            >
              <UploadCloud className="h-5 w-5" />
              {uploadingQual ? 'Uploading…' : 'Upload qualification(s)'}
            </button>
          )}

          <input
            ref={qualInputRef}
            type="file"
            accept={QUAL_ACCEPTED.join(',')}
            multiple
            onChange={handleQualFiles}
            className="hidden"
          />
        </div>
      </Card>

      {/* Declaration */}
      <Card padding="lg">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={declarationAccepted}
            onChange={(e) => setDeclarationAccepted(e.target.checked)}
            disabled={locked}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-60"
          />
          <span className="text-sm text-gray-700">
            <span className="font-medium text-gray-900">I confirm that:</span>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-600">
              <li>All information provided is true and accurate.</li>
              <li>I am legally permitted to provide coaching services.</li>
              <li>
                I have not been convicted of offences involving violence, child abuse, sexual
                misconduct, fraud, or conduct that would make me unsuitable to coach children.
              </li>
              <li>
                I understand CoachNest may suspend or remove my account if any information
                provided is false.
              </li>
            </ul>
          </span>
        </label>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <a
          href="/dashboard/coach"
          className="text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          ← Back to dashboard
        </a>

        {locked ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setLocked(false)}
          >
            Resubmit
          </Button>
        ) : (
          <Button type="submit" size="lg" disabled={!canSubmit} loading={submitting}>
            Submit for Verification
          </Button>
        )}
      </div>

      {locked && (
        <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700 ring-1 ring-blue-200">
          Documents submitted. The CoachNest team will review within 3–5 business days.
        </div>
      )}
    </form>
  )
}
