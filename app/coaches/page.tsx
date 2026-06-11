import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata = { title: 'Find Coaches — CoachNest' }

export default function CoachesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900">Find a Coach</h1>
          <p className="mt-3 text-gray-500">
            Search and filter coaches is coming soon. Check back shortly!
          </p>
          <div className="mt-12 flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white">
            <p className="text-gray-400">Coach listing — coming soon</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
