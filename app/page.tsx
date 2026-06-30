import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/landing/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import SportsCategories from '@/components/landing/SportsCategories'
import FeaturedCoaches from '@/components/landing/FeaturedCoaches'
import CTABanner from '@/components/landing/CTABanner'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    redirect(profile?.role === 'coach' ? '/dashboard/coach' : '/dashboard/client')
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <SportsCategories />
        <FeaturedCoaches />
        <CTABanner />
      </main>
      <Footer />
    </>
  )
}
