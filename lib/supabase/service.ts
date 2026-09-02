import { createClient } from '@supabase/supabase-js'

// Bypasses RLS — only ever use from server-side admin API routes that
// have already called requireAdmin(), never from client components.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
