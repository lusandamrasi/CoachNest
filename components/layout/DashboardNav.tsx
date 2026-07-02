'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Logo from '@/components/layout/Logo'

interface DashboardNavProps {
  fullName: string | null
  avatarUrl: string | null
  profileHref: string
  dashboardHref: string
}

export default function DashboardNav({
  fullName,
  avatarUrl,
  profileHref,
  dashboardHref,
}: DashboardNavProps) {
  const router = useRouter()

  async function handleSignOut() {
    if (!window.confirm('Are you sure you want to sign out?')) return
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initial = (fullName?.trim()?.[0] ?? '?').toUpperCase()

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href={dashboardHref}
          title="Go to Dashboard"
          aria-label="Go to Dashboard"
          className="flex items-center"
        >
          <Logo size="sm" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href={dashboardHref}
            className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
          >
            Home
          </Link>
          <Link
            href="/coaches"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
          >
            Find Coaches
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
          >
            Contact Us
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={profileHref}
            aria-label="View profile"
            className="block h-10 w-10 overflow-hidden rounded-full ring-2 ring-transparent transition-all hover:ring-blue-200 focus-visible:outline-none focus-visible:ring-blue-400"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={fullName ?? 'Profile'}
                width={40}
                height={40}
                className="h-10 w-10 object-cover"
                unoptimized
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center bg-blue-600 text-base font-semibold text-white">
                {initial}
              </span>
            )}
          </Link>

          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}
