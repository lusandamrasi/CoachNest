import Link from 'next/link'

const sports = [
  { label: 'Tennis', emoji: '🎾' },
  { label: 'Basketball', emoji: '🏀' },
  { label: 'Yoga', emoji: '🧘' },
  { label: 'Golf', emoji: '⛳' },
  { label: 'Soccer', emoji: '⚽' },
  { label: 'Swimming', emoji: '🏊' },
  { label: 'Boxing', emoji: '🥊' },
  { label: 'Cycling', emoji: '🚴' },
  { label: 'CrossFit', emoji: '🏋️' },
]

export default function SportsCategories() {
  return (
    <section className="bg-gray-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">Browse by Sport</h2>

        <div className="flex gap-3 overflow-x-auto pb-3 md:flex-wrap md:justify-center md:overflow-visible md:pb-0">
          {sports.map((sport) => (
            <Link
              key={sport.label}
              href={`/coaches?preset_sport=${encodeURIComponent(sport.label)}`}
              className="flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md"
            >
              <span className="text-base">{sport.emoji}</span>
              {sport.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
