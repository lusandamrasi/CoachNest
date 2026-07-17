'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Menu, X, LogOut } from 'lucide-react'
import Button from '@/components/ui/Button'
import Logo from '@/components/layout/Logo'
import ThemeToggle from '@/components/layout/ThemeToggle'
import CartButton from '@/components/client/CartButton'
import { createClient } from '@/lib/supabase/client'

type AuthUser = {
  fullName: string | null
  avatarUrl: string | null
  role: 'coach' | 'client'
  dashboardHref: string
  profileHref: string
}

export default function Navbar() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    let active = true

    async function loadProfile(userId: string) {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, role, avatar_url')
        .eq('id', userId)
        .single()

      if (!active) return
      const role = data?.role === 'coach' ? 'coach' : 'client'
      setAuthUser({
        fullName: data?.full_name ?? null,
        avatarUrl: data?.avatar_url ?? null,
        role,
        dashboardHref: role === 'coach' ? '/dashboard/coach' : '/dashboard/client',
        profileHref: role === 'coach' ? '/dashboard/coach/profile' : '/dashboard/client/profile',
      })
      setAuthReady(true)
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return
      if (user) {
        loadProfile(user.id)
      } else {
        setAuthUser(null)
        setAuthReady(true)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setAuthUser(null)
        setAuthReady(true)
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function handleSignOut() {
    if (!window.confirm('Are you sure you want to sign out?')) return
    const supabase = createClient()
    await supabase.auth.signOut()
    setMobileOpen(false)
    router.push('/')
    router.refresh()
  }

  const homeHref = authUser ? authUser.dashboardHref : '/auth/login'
  const navLinks = [
    { href: homeHref, label: 'Home' },
    { href: '/coaches', label: 'Find Coaches' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact Us' },
  ]

  const initial = (authUser?.fullName?.trim()?.[0] ?? '?').toUpperCase()

  return (
    <header
      className={`sticky inset-x-0 top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm transition-shadow duration-200 ${
        scrolled ? 'shadow-sm' : ''
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo — always goes to the landing page */}
        <Link href="/" aria-label="Go to CoachNest home" className="flex items-center">
          <Logo size="md" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {!authReady ? null : authUser ? (
            <>
              {authUser.role === 'client' && <CartButton />}
              <Link
                href={authUser.profileHref}
                aria-label="View my profile"
                className="group flex flex-col items-center focus-visible:outline-none"
              >
                <span className="block h-9 w-9 overflow-hidden rounded-full ring-2 ring-transparent transition-all group-hover:ring-blue-200 group-focus-visible:ring-blue-400">
                  {authUser.avatarUrl ? (
                    <Image
                      src={authUser.avatarUrl}
                      alt={authUser.fullName ?? 'Profile'}
                      width={36}
                      height={36}
                      className="h-9 w-9 object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center bg-blue-600 text-sm font-semibold text-white">
                      {initial}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 text-[10px] font-medium leading-none text-gray-500 group-hover:text-blue-600">
                  My Profile
                </span>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          {authReady && authUser?.role === 'client' && <CartButton />}
          <button
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 shadow-lg">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-gray-200" />
            {!authReady ? null : authUser ? (
              <>
                <Link
                  href={authUser.dashboardHref}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  My Dashboard
                </Link>
                <Link
                  href={authUser.profileHref}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  My Profile
                </Link>
                <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">Sign In</Button>
                </Link>
                <Link href="/auth/signup" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full">Get Started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
