'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

export default function AuthButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5">
      <LogOut className="h-4 w-4" />
      Sign Out
    </Button>
  )
}
