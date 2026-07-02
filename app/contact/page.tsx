import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ContactForm from '@/components/contact/ContactForm'

export const metadata = { title: 'Contact Us — CoachNest' }

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Contact Us</h1>
            <p className="mt-3 text-base text-gray-600">
              Have a question? We&apos;d love to hear from you.
            </p>
          </div>

          <ContactForm />
        </div>
      </main>
      <Footer />
    </>
  )
}
