'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/coaches', label: 'Find Coaches' },
    { href: '#about', label: 'About' },
  ]

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${
        scrolled ? 'border-b border-gray-200 bg-white/90 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-lg font-bold select-none">
            C
          </span>
          <span className="text-xl font-bold text-gray-900">CoachNest</span>
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
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
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
            <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" size="sm" className="w-full">Sign In</Button>
            </Link>
            <Link href="/auth/signup" onClick={() => setMobileOpen(false)}>
              <Button size="sm" className="w-full">Get Started</Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
