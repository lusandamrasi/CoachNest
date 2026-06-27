'use client'

import { useEffect, useRef } from 'react'
import { Map, useMap } from '@vis.gl/react-google-maps'

interface TravelRadiusMapProps {
  lat: number | null
  lng: number | null
  radiusKm: number
}

function zoomForRadius(radiusKm: number): number {
  const safe = radiusKm > 0 ? radiusKm : 1
  return Math.round(14 - Math.log2(safe))
}

function CircleOverlay({
  lat,
  lng,
  radiusKm,
}: {
  lat: number
  lng: number
  radiusKm: number
}) {
  const map = useMap()
  const circleRef = useRef<google.maps.Circle | null>(null)

  useEffect(() => {
    if (!map) return
    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle({
        map,
        center: { lat, lng },
        radius: radiusKm * 1000,
        fillColor: '#2563EB',
        fillOpacity: 0.15,
        strokeColor: '#2563EB',
        strokeWeight: 2,
        clickable: false,
      })
    } else {
      circleRef.current.setCenter({ lat, lng })
      circleRef.current.setRadius(radiusKm * 1000)
    }
    return () => {
      // keep circle alive while map exists; clean up only on unmount
    }
  }, [map, lat, lng, radiusKm])

  useEffect(() => {
    return () => {
      circleRef.current?.setMap(null)
      circleRef.current = null
    }
  }, [])

  return null
}

export default function TravelRadiusMap({ lat, lng, radiusKm }: TravelRadiusMapProps) {
  if (lat == null || lng == null) {
    return (
      <p className="mt-2 text-xs text-gray-400">
        Enter your location above to see your travel radius on the map
      </p>
    )
  }

  const center = { lat, lng }
  const zoom = zoomForRadius(radiusKm)

  return (
    <div className="relative mt-3 h-[300px] w-full overflow-hidden rounded-xl border border-gray-200">
      <Map
        center={center}
        zoom={zoom}
        gestureHandling="none"
        disableDefaultUI
        clickableIcons={false}
        keyboardShortcuts={false}
      >
        <CircleOverlay lat={lat} lng={lng} radiusKm={radiusKm} />
      </Map>
      <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200">
        ~{radiusKm}km radius
      </div>
    </div>
  )
}
