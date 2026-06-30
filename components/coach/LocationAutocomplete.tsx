'use client'

import { useEffect, useRef, useState } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'

export interface LocationValue {
  address: string
  lat: number | null
  lng: number | null
}

interface LocationAutocompleteProps {
  value: LocationValue
  onChange: (next: LocationValue) => void
  label?: string
  placeholder?: string
  id?: string
}

const SA_BIAS_BOUNDS = {
  south: -35.0,
  west: 16.0,
  north: -22.0,
  east: 33.0,
}

export default function LocationAutocomplete({
  value,
  onChange,
  label,
  placeholder = 'Cape Town, ZA',
  id = 'location',
}: LocationAutocompleteProps) {
  const placesLib = useMapsLibrary('places')
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [draft, setDraft] = useState(value.address)

  useEffect(() => {
    setDraft(value.address)
  }, [value.address])

  useEffect(() => {
    if (!placesLib || !inputRef.current) return

    const bounds = new google.maps.LatLngBounds(
      { lat: SA_BIAS_BOUNDS.south, lng: SA_BIAS_BOUNDS.west },
      { lat: SA_BIAS_BOUNDS.north, lng: SA_BIAS_BOUNDS.east },
    )

    const autocomplete = new placesLib.Autocomplete(inputRef.current, {
      bounds,
      strictBounds: false,
      fields: ['formatted_address', 'geometry', 'name'],
    })
    autocompleteRef.current = autocomplete

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      const address =
        place.formatted_address ?? place.name ?? inputRef.current?.value ?? ''
      const lat = place.geometry?.location?.lat() ?? null
      const lng = place.geometry?.location?.lng() ?? null
      setDraft(address)
      onChange({ address, lat, lng })
    })

    return () => {
      listener.remove()
      autocompleteRef.current = null
    }
  }, [placesLib, onChange])

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          if (e.target.value.trim() === '') {
            onChange({ address: '', lat: null, lng: null })
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  )
}
