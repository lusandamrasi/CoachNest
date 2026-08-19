import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import MapsProvider from '@/components/providers/MapsProvider'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://coachnest.co.za'),
  title: {
    default: 'CoachNest — Find a Sports Coach in South Africa',
    template: '%s | CoachNest',
  },
  description: 'Book qualified sports coaches across South Africa. Find coaches for tennis, football, swimming, golf and more.',
  keywords: ['sports coach', 'coaching South Africa', 'book a coach', 'tennis coach', 'football coach'],
  openGraph: {
    title: 'CoachNest — Find a Sports Coach in South Africa',
    description: 'Book qualified sports coaches across South Africa.',
    url: 'https://coachnest.co.za',
    siteName: 'CoachNest',
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoachNest — Find a Sports Coach in South Africa',
    description: 'Book qualified sports coaches across South Africa.',
  },
  alternates: {
    canonical: 'https://coachnest.co.za',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before paint to avoid a light-mode flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col font-sans antialiased`}>
        <MapsProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </MapsProvider>
      </body>
    </html>
  )
}
