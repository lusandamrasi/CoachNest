const VALUES = ['Trust', 'Integrity', 'Transparency', 'Safety', 'Simplicity', 'Community']

export default function OurValues() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">What we stand for</h2>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {VALUES.map((value) => (
            <span
              key={value}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm"
            >
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              {value}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
