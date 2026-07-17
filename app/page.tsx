import Hero from '@/components/landing/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import SportsCategories from '@/components/landing/SportsCategories'
import FeaturedCoaches from '@/components/landing/FeaturedCoaches'
import CTABanner from '@/components/landing/CTABanner'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <SportsCategories />
      <FeaturedCoaches />
      <CTABanner />
    </main>
  )
}
