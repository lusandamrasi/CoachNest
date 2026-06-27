'use client'

import { APIProvider } from '@vis.gl/react-google-maps'
import type { ReactNode } from 'react'

export default function MapsProvider({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  return (
    <APIProvider apiKey={apiKey} libraries={['places']}>
      {children}
    </APIProvider>
  )
}
