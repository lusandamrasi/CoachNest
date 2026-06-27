'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { loginSchema } from '@/lib/validations/auth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PasswordInput from '@/components/ui/PasswordInput'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get('redirect') ?? null
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setServerError('')

    const formData = new FormData(e.currentTarget)
    const raw = { email: formData.get('email'), password: formData.get('password') }
    const result = loginSchema.safeParse(raw)

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message
      })
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword(result.data)

    if (error) {
      setServerError(error.message)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const fallback = profile?.role === 'coach' ? '/dashboard/coach' : '/dashboard/client'
    const target = redirectTo && redirectTo.startsWith('/') ? redirectTo : fallback
    router.push(target)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {serverError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{serverError}</div>
      )}

      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email}
      />

      <PasswordInput
        id="password"
        name="password"
        label="Password"
        placeholder="••••••••"
        autoComplete="current-password"
        error={errors.password}
      />

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Sign In
      </Button>

      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="font-medium text-blue-600 hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  )
}
