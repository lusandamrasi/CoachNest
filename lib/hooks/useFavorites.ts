'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

let favoriteIds: Set<string> | null = null
let currentUserId: string | null | undefined = undefined // undefined = auth not checked yet
let inFlight: Promise<void> | null = null
let authListenerRegistered = false

const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((fn) => fn())
}

function loadFavorites(): Promise<void> {
  if (inFlight) return inFlight

  inFlight = (async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      favoriteIds = new Set()
      currentUserId = null
      notify()
      return
    }

    currentUserId = user.id
    const { data, error } = await supabase
      .from('favorites')
      .select('coach_id')
      .eq('user_id', user.id)

    favoriteIds = error ? new Set() : new Set((data ?? []).map((row) => row.coach_id as string))
    notify()
  })().finally(() => {
    inFlight = null
  })

  return inFlight
}

function registerAuthListener() {
  if (authListenerRegistered) return
  authListenerRegistered = true

  const supabase = createClient()
  supabase.auth.onAuthStateChange((_event, session) => {
    const uid = session?.user?.id ?? null
    if (uid !== currentUserId) {
      favoriteIds = null
      currentUserId = undefined
      notify()
    }
  })
}

export async function toggleFavorite(coachId: string): Promise<void> {
  if (!currentUserId) return
  const userId = currentUserId

  const wasFavorited = favoriteIds?.has(coachId) ?? false
  const optimistic = new Set(favoriteIds ?? [])
  if (wasFavorited) optimistic.delete(coachId)
  else optimistic.add(coachId)
  favoriteIds = optimistic
  notify()

  const supabase = createClient()
  const { error } = wasFavorited
    ? await supabase.from('favorites').delete().eq('user_id', userId).eq('coach_id', coachId)
    : await supabase.from('favorites').insert({ user_id: userId, coach_id: coachId })

  if (error) {
    const reverted = new Set(favoriteIds ?? [])
    if (wasFavorited) reverted.add(coachId)
    else reverted.delete(coachId)
    favoriteIds = reverted
    notify()
  }
}

export function useFavorites() {
  const [, setVersion] = useState(0)

  useEffect(() => {
    registerAuthListener()
    const listener = () => setVersion((v) => v + 1)
    listeners.add(listener)
    if (favoriteIds === null && !inFlight) {
      loadFavorites()
    }
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const isFavorited = useCallback((coachId: string) => favoriteIds?.has(coachId) ?? false, [])

  return {
    isFavorited,
    loading: favoriteIds === null,
    isLoggedIn: currentUserId !== null && currentUserId !== undefined,
    toggleFavorite,
  }
}
