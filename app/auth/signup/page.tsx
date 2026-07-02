import Link from 'next/link'
import SignupForm from '@/components/auth/SignupForm'
import Logo from '@/components/layout/Logo'

export const metadata = { title: 'Create Account — CoachNest' }

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center">
          <Logo size="md" />
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-1 text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mb-6 text-sm text-gray-500">Join CoachNest — it&apos;s free</p>
          <SignupForm />
        </div>
      </div>
    </div>
  )
}
