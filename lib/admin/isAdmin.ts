import { createClient } from '@/lib/supabase/server'

// Uses getUser() rather than getSession() — getSession() trusts the
// cookie as-is, while getUser() revalidates against Supabase Auth.
// Every other auth check in this codebase (middleware, admin routes) does the same.
export async function requireAdmin(): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin'
}
