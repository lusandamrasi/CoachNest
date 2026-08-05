import AboutHero from '@/components/about/AboutHero'
import OurStory from '@/components/about/OurStory'
import WhyDifferent from '@/components/about/WhyDifferent'
import OurValues from '@/components/about/OurValues'
import CTABanner from '@/components/landing/CTABanner'

export const metadata = { title: 'About — CoachNest' }

export default function AboutPage() {
  return (
    <main>
      <AboutHero />
      <OurStory />
      <WhyDifferent />
      <OurValues />
      <CTABanner />
    </main>
  )
}
