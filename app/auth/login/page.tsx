import { Suspense } from 'react'
import Link from 'next/link'
import LoginForm from '@/components/auth/LoginForm'

export const metadata = { title: 'Sign In — CoachNest' }

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-lg font-bold">C</span>
          <span className="text-xl font-bold text-gray-900">CoachNest</span>
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-1 text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mb-6 text-sm text-gray-500">Sign in to your CoachNest account</p>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
