import Link from 'next/link'

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M13.5 21.9v-8.4h2.8l.5-3.3h-3.3V8.1c0-.9.3-1.6 1.7-1.6h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.5v3.3h2.7v8.4a10 10 0 0 0 3.3 0Z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

const columns: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'About',
    links: [
      { label: 'Who are we?', href: '/about' },
      { label: 'Terms & Conditions', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
  {
    heading: 'All Sports',
    links: [
      { label: 'Tennis', href: '/coaches?preset_sport=Tennis' },
      { label: 'Basketball', href: '/coaches?preset_sport=Basketball' },
      { label: 'Yoga', href: '/coaches?preset_sport=Yoga' },
      { label: 'Golf', href: '/coaches?preset_sport=Golf' },
      { label: 'Soccer', href: '/coaches?preset_sport=Soccer' },
      { label: 'Swimming', href: '/coaches?preset_sport=Swimming' },
      { label: 'Boxing', href: '/coaches?preset_sport=Boxing' },
      { label: 'Cycling', href: '/coaches?preset_sport=Cycling' },
      { label: 'CrossFit', href: '/coaches?preset_sport=CrossFit' },
    ],
  },
  {
    heading: 'Join the adventure',
    links: [
      { label: 'Become a Coach', href: '/auth/signup' },
      { label: 'Find a Coach', href: '/coaches' },
      { label: 'My Bookings', href: '/booking/my-bookings' },
    ],
  },
  {
    heading: 'Help',
    links: [
      { label: 'Need Help?', href: '/contact' },
      { label: 'Contact', href: '/contact' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-[#141416] text-white">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6 lg:px-8">
        {/* Link columns */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-lg font-bold sm:text-xl">{col.heading}</h3>
              <ul className="mt-6 space-y-3.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm font-semibold text-white/90 transition-colors hover:text-white hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 border-t border-white/25 pt-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <p className="text-sm font-semibold text-white/70">
              © {new Date().getFullYear()} CoachNest, train with the best!
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="CoachNest on Facebook"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="CoachNest on Instagram"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
