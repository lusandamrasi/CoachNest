'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

export default function DeleteAccountSection() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleted, setDeleted] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' })
      const body = await res.json()
      if (!res.ok) {
        throw new Error(body?.error ?? 'Something went wrong. Please try again.')
      }

      setDeleted(true)
      const supabase = createClient()
      await supabase.auth.signOut()
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 600)
    } catch (err) {
      setLoading(false)
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/30 p-6">
      <h2 className="text-lg font-semibold text-gray-900">Danger Zone</h2>
      <p className="mt-1 text-sm text-gray-600">
        Permanently delete your account and all associated data. This cannot be undone.
      </p>
      <Button
        type="button"
        variant="danger"
        size="sm"
        className="mt-4 gap-1.5"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
        Delete Account
      </Button>

      <ConfirmDialog
        isOpen={isOpen}
        title="Delete your account?"
        message={
          deleted
            ? 'Account deleted. Redirecting…'
            : 'This will permanently delete your profile and all associated data. This cannot be undone.'
        }
        confirmLabel="Delete Account"
        loading={loading}
        error={error}
        onConfirm={handleConfirm}
        onCancel={() => {
          if (!loading) {
            setIsOpen(false)
            setError(null)
          }
        }}
      />
    </div>
  )
}
