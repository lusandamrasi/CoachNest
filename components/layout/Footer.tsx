import Link from 'next/link'
import Logo from '@/components/layout/Logo'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          {/* Brand */}
          <div className="flex flex-col items-center gap-2 md:items-start">
            <Link href="/" className="flex items-center">
              <Logo size="sm" />
            </Link>
            <p className="text-sm text-gray-500">Connect with certified coaches worldwide.</p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <Link href="/coaches" className="hover:text-blue-600">Find Coaches</Link>
            <Link href="/auth/signup" className="hover:text-blue-600">Become a Coach</Link>
            <Link href="#about" className="hover:text-blue-600">About</Link>
          </nav>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} CoachNest. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
