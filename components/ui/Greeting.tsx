'use client'

import { useEffect, useState } from 'react'

interface GreetingProps {
  fullName: string | null
  fallback?: string
}

function timeOfDayGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Greeting({ fullName, fallback = 'there' }: GreetingProps) {
  const firstName = fullName?.split(' ')[0] || fallback

  const [greeting, setGreeting] = useState<string | null>(null)

  useEffect(() => {
    setGreeting(timeOfDayGreeting(new Date().getHours()))
  }, [])

  if (!greeting) {
    return (
      <>
        Welcome back, {firstName} 👋
      </>
    )
  }

  return (
    <>
      {greeting}, {firstName} 👋
    </>
  )
}
