import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/landing/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import SportsCategories from '@/components/landing/SportsCategories'
import FeaturedCoaches from '@/components/landing/FeaturedCoaches'
import CTABanner from '@/components/landing/CTABanner'

export default function HomePage() {
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
