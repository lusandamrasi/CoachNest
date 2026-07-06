import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ContactForm from '@/components/contact/ContactForm'
import { FileText, AlertTriangle, LifeBuoy, Star } from 'lucide-react'

export const metadata = { title: 'Contact Us — CoachNest' }

const PLACEHOLDERS = [
  {
    icon: FileText,
    title: 'Terms & Conditions',
    description: 'Read our platform terms, privacy policy, and coaching agreement.',
    cta: 'View T&Cs',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: AlertTriangle,
    title: 'Report a Problem',
    description: 'Something not working? Let us know so we can fix it.',
    cta: 'Report an issue',
    color: 'text-amber-600 bg-amber-50',
  },
  {
    icon: LifeBuoy,
    title: 'Help Center',
    description: 'Browse guides and FAQs for coaches and clients.',
    cta: 'Visit Help Center',
    color: 'text-green-600 bg-green-50',
  },
  {
    icon: Star,
    title: 'Review Us',
    description: 'Enjoying CoachNest? Share your experience with others.',
    cta: 'Leave a review',
    color: 'text-orange-600 bg-orange-50',
  },
]

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Contact Us</h1>
            <p className="mt-3 text-base text-gray-600">
              Have a question? We&apos;d love to hear from you.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
            {/* Left: enquiry form (already-functioning) */}
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Send us a message
              </h2>
              <ContactForm />
            </div>

            {/* Right: placeholder tiles */}
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                More ways to get help
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {PLACEHOLDERS.map((tile) => {
                  const Icon = tile.icon
                  return (
                    <button
                      key={tile.title}
                      type="button"
                      disabled
                      title="Coming soon"
                      className="group flex h-full cursor-not-allowed flex-col rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-90"
                    >
                      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${tile.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">{tile.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{tile.description}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-600 group-hover:underline">
                          {tile.cta} →
                        </span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          Coming soon
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <p className="mt-5 text-center text-xs text-gray-400 sm:text-left">
                These features are on the roadmap — use the form on the left to reach us in the meantime.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
