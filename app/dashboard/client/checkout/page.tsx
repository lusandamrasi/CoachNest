import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CheckoutContent from '@/components/client/CheckoutContent'

export const metadata = { title: 'Checkout — CoachNest' }
export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, avatar_url')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'coach') redirect('/dashboard/coach')

  return (
    <div className="min-h-screen bg-gray-50">
      <main>
        <CheckoutContent />
      </main>
    </div>
  )
}
