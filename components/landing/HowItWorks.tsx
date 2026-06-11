import { Search, CalendarCheck, Trophy } from 'lucide-react'

const steps = [
  {
    icon: Search,
    step: '01',
    title: 'Browse Coaches',
    description:
      'Search by sport, location, and price. Read reviews and watch intro videos to find your perfect match.',
  },
  {
    icon: CalendarCheck,
    step: '02',
    title: 'Book a Session',
    description:
      'Pick a time that works for you, pay securely online, and get instant confirmation.',
  },
  {
    icon: Trophy,
    step: '03',
    title: 'Start Training',
    description:
      'Meet your coach and begin your personalised training programme. Track progress over time.',
  },
]

export default function HowItWorks() {
  return (
    <section className="bg-white py-24" id="how-it-works">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-blue-600">Simple process</span>
          <h2 className="mt-2 text-4xl font-bold text-gray-900">How It Works</h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-500">
            Getting started with CoachNest takes less than 5 minutes.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="absolute top-10 left-[calc(50%+3rem)] hidden h-0.5 w-[calc(100%-6rem)] bg-gradient-to-r from-blue-200 to-blue-100 md:block" />
              )}

              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50">
                <step.icon className="h-8 w-8 text-blue-600" />
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {step.step}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-gray-500">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
