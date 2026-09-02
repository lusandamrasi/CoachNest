'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, AlertCircle, UploadCloud, FileText, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

type VerificationStatus =
  | 'unverified'
  | 'pending'
  | 'id_verified'
  | 'qualification_verified'
  | 'verified'

const STATUS_CARD: Record<
  VerificationStatus,
  { tone: 'gray' | 'amber' | 'blue' | 'green'; message: string }
> = {
  unverified: {
    tone: 'gray',
    message: 'Your documents have not been submitted yet.',
  },
  pending: {
    tone: 'amber',
    message:
      'Document verification pending — the CoachNest team will review your submission within 3–5 business days.',
  },
  id_verified: {
    tone: 'blue',
    message: 'ID verified. Awaiting qualification review.',
  },
  qualification_verified: {
    tone: 'blue',
    message: 'Qualifications verified. Final review in progress.',
  },
  verified: {
    tone: 'green',
    message:
      '✓ You are a Verified Coach. Your badge is now visible on your public profile.',
  },
}

const TONE_CLASSES: Record<'gray' | 'amber' | 'blue' | 'green', string> = {
  gray: 'border-gray-200 bg-gray-50 text-gray-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  blue: 'border-blue-200 bg-blue-50 text-blue-800',
  green: 'border-green-200 bg-green-50 text-green-800',
}

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

  const [idConfirm, setIdConfirm] = useState<'replace' | 'remove' | null>(null)
  const [idConfirmLoading, setIdConfirmLoading] = useState(false)
  const [idConfirmError, setIdConfirmError] = useState<string | null>(null)

  const idInputRef = useRef<HTMLInputElement>(null)
  const qualInputRef = useRef<HTMLInputElement>(null)
  // Set when a replace is confirmed, so handleIdFile knows to reset the
  // verification status once the new file actually finishes uploading.
  const pendingReplaceResetRef = useRef(false)

  // Once a document has been reviewed at all, swapping it out invalidates
  // that review — the coach must be warned and re-reviewed from Pending.
  const idStatusAtRisk = status === 'verified' || status === 'id_verified' || status === 'qualification_verified'

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
    if (!file) {
      pendingReplaceResetRef.current = false
      return
    }
    if (!ID_ACCEPTED.includes(file.type)) {
      setError('ID must be a PDF, JPG, or PNG.')
      pendingReplaceResetRef.current = false
      return
    }
    if (file.size > DOC_MAX_BYTES) {
      setError('ID file must be 10MB or smaller.')
      pendingReplaceResetRef.current = false
      return
    }

    setUploadingId(true)
    const ext = file.name.split('.').pop() ?? 'pdf'
    const path = `${userId}/id.${ext}`
    const result = await uploadPrivate(file, path)
    if (result) {
      setIdDocUrl(path)
      if (pendingReplaceResetRef.current) {
        await resetStatusToPending('New ID document uploaded. Your verification status has been reset to Pending.')
      }
    }
    pendingReplaceResetRef.current = false
    setUploadingId(false)
  }

  async function resetStatusToPending(successMessage: string) {
    const supabase = createClient()
    const { error: updErr } = await supabase
      .from('coach_profiles')
      .update({ verification_status: 'pending' })
      .eq('id', userId)

    if (updErr) {
      setError(`Failed to reset verification status: ${updErr.message}`)
      return
    }
    setStatus('pending')
    showToast({ kind: 'success', message: successMessage })
  }

  function handleReplaceClick() {
    if (idStatusAtRisk) {
      setIdConfirm('replace')
    } else {
      idInputRef.current?.click()
    }
  }

  function handleRemoveClick() {
    if (idStatusAtRisk) {
      setIdConfirm('remove')
    } else {
      void removeIdDocument()
    }
  }

  async function removeIdDocument(): Promise<boolean> {
    const supabase = createClient()
    const nextStatus: VerificationStatus = idStatusAtRisk ? 'pending' : status

    const { error: updErr } = await supabase
      .from('coach_profiles')
      .update({ id_document_url: null, verification_status: nextStatus })
      .eq('id', userId)

    if (updErr) {
      setIdConfirmError(`Failed to remove document: ${updErr.message}`)
      return false
    }

    setIdDocUrl(null)
    if (nextStatus !== status) {
      setStatus(nextStatus)
      showToast({ kind: 'success', message: 'ID document removed. Your verification status has been reset to Pending.' })
    }
    return true
  }

  async function handleIdConfirm() {
    if (idConfirm === 'replace') {
      setIdConfirm(null)
      pendingReplaceResetRef.current = true
      idInputRef.current?.click()
      return
    }
    if (idConfirm === 'remove') {
      setIdConfirmLoading(true)
      setIdConfirmError(null)
      const ok = await removeIdDocument()
      setIdConfirmLoading(false)
      if (ok) setIdConfirm(null)
    }
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
    if (qualUrls.length === 0) {
      setError('Please upload at least one qualification or certificate.')
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

  const canSubmit = declarationAccepted && !!idDocUrl && qualUrls.length > 0 && !submitting

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

      <ConfirmDialog
        isOpen={idConfirm !== null}
        title={idConfirm === 'replace' ? 'Replace ID Document?' : 'Remove ID Document?'}
        message={
          idConfirm === 'replace'
            ? 'Replacing your ID document will reset your verification status to Pending until the new document is reviewed and verified again.'
            : 'Removing your ID document will reset your verification status to Pending and hide your Verified badge until a new document is uploaded and verified.'
        }
        confirmLabel={idConfirm === 'replace' ? 'Replace Document' : 'Remove Document'}
        loading={idConfirmLoading}
        error={idConfirmError}
        onConfirm={handleIdConfirm}
        onCancel={() => {
          setIdConfirm(null)
          setIdConfirmError(null)
        }}
      />

      {/* Status card */}
      <Card padding="lg">
        <div className="flex items-center gap-2 text-blue-600">
          <ShieldCheck className="h-5 w-5" />
          <h2 className="text-lg font-semibold text-gray-900">Verification Status</h2>
        </div>
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${TONE_CLASSES[STATUS_CARD[status].tone]}`}
        >
          {STATUS_CARD[status].message}
        </div>
      </Card>

      {/* Uploads */}
      <Card padding="lg">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">SA ID or Passport</h2>
          <span className="text-xs text-gray-400">Required for verified badge</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">PDF, JPG, or PNG. Max 10MB.</p>

        <div className="mt-4">
          {idDocUrl ? (
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <Check className="h-4 w-4 text-green-600" />
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="flex-1 truncate text-sm text-gray-700">
                {filenameFromUrl(idDocUrl)}
              </span>
              <button
                type="button"
                onClick={handleReplaceClick}
                disabled={uploadingId}
                className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemoveClick}
                disabled={uploadingId}
                className="text-xs font-medium text-gray-500 hover:text-red-500 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => idInputRef.current?.click()}
              disabled={uploadingId}
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
              <button
                type="button"
                onClick={() => removeQual(path)}
                className="text-xs font-medium text-gray-500 hover:text-red-500"
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => qualInputRef.current?.click()}
            disabled={uploadingQual}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-6 text-sm text-gray-600 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50"
          >
            <UploadCloud className="h-5 w-5" />
            {uploadingQual ? 'Uploading…' : 'Upload qualification(s)'}
          </button>

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
