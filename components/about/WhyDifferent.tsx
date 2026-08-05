import { Briefcase, Eye, Wallet, ShieldCheck } from 'lucide-react'

const FEATURES = [
  {
    icon: Briefcase,
    title: 'A real business page',
    description:
      'No website to build, no marketing to figure out — just a polished profile built to turn visitors into clients.',
  },
  {
    icon: Eye,
    title: 'More visibility',
    description:
      'Coaches are discoverable by clients actively searching for their exact skills — a steady stream of new work.',
  },
  {
    icon: Wallet,
    title: 'Keep 100% of your price',
    description:
      "Whatever a coach charges, that's what they take home. A small booking fee is shown to the client at checkout.",
  },
  {
    icon: ShieldCheck,
    title: 'Secure, simple bookings',
    description:
      'Search, book, and pay in one place — no chasing coaches over WhatsApp or awkward cash exchanges.',
  },
]

export default function WhyDifferent() {
  return (
    <section className="bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Why CoachNest is different</h2>
          <p className="mt-4 text-gray-500">
            We built the platform we wished existed — for coaches first, and for the athletes who
            rely on them.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
                <feature.icon className="h-5 w-5 text-indigo-900" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
