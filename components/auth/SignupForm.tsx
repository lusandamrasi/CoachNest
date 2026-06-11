'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserRound, Dumbbell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { signupSchema } from '@/lib/validations/auth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import type { UserRole } from '@/lib/types'

export default function SignupForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<UserRole>('client')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setServerError('')

    const formData = new FormData(e.currentTarget)
    const raw = {
      full_name: formData.get('full_name'),
      email: formData.get('email'),
      password: formData.get('password'),
      role,
    }
    const result = signupSchema.safeParse(raw)

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

    const { data, error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        data: { full_name: result.data.full_name },
      },
    })

    if (error) {
      setServerError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase
        .from('profiles')
        .update({ role: result.data.role, full_name: result.data.full_name })
        .eq('id', data.user.id)

      if (result.data.role === 'coach') {
        await supabase
          .from('coach_profiles')
          .insert({ id: data.user.id, sport: '' })
      }

      router.push(result.data.role === 'coach' ? '/dashboard/coach' : '/dashboard/client')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {serverError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{serverError}</div>
      )}

      {/* Role selector */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">I want to...</label>
        <div className="grid grid-cols-2 gap-3">
          {(['client', 'coach'] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`
                flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all
                ${role === r
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }
              `}
            >
              {r === 'client' ? <UserRound className="h-5 w-5" /> : <Dumbbell className="h-5 w-5" />}
              <div>
                <p className="font-semibold capitalize">{r === 'client' ? 'Find a Coach' : 'Coach Others'}</p>
                <p className="text-xs text-gray-400">{r === 'client' ? 'Book sessions' : 'Earn & teach'}</p>
              </div>
            </button>
          ))}
        </div>
        {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
      </div>

      <Input
        id="full_name"
        name="full_name"
        type="text"
        label="Full Name"
        placeholder="Alex Johnson"
        autoComplete="name"
        error={errors.full_name}
      />

      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email}
      />

      <Input
        id="password"
        name="password"
        type="password"
        label="Password"
        placeholder="••••••••"
        autoComplete="new-password"
        error={errors.password}
      />

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Create Account
      </Button>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-medium text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
