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
  title: 'CoachNest — Find Your Perfect Private Coach',
  description:
    'Connect with certified coaches in tennis, basketball, yoga, golf and more. Book 1-on-1 sessions tailored to your goals.',
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
