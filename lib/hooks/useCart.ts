'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type CartItem = {
  id: string
  date: string
  start_time: string
  end_time: string
  coach_profiles: {
    sport: string | null
    hourly_rate: number | null
    profiles: {
      full_name: string | null
      avatar_url: string | null
    } | null
  } | null
}

let refreshVersion = 0
const listeners = new Set<() => void>()

export function refreshCart() {
  refreshVersion += 1
  listeners.forEach((fn) => fn())
}

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [version, setVersion] = useState(refreshVersion)

  useEffect(() => {
    const listener = () => setVersion(refreshVersion)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setCartItems([])
      setIsLoading(false)
      return
    }

    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, date, start_time, end_time,
        coach_profiles (
          sport, hourly_rate,
          profiles ( full_name, avatar_url )
        )
      `)
      .eq('student_id', user.id)
      .eq('status', 'confirmed')
      .eq('paid', false)
      .gte('date', todayStr)
      .order('date', { ascending: true })

    if (error) {
      setCartItems([])
    } else {
      setCartItems((data ?? []) as unknown as CartItem[])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load, version])

  const cartCount = cartItems.length
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + (item.coach_profiles?.hourly_rate ?? 0),
    0
  )

  return { cartItems, cartCount, cartTotal, isLoading, refresh: refreshCart }
}
