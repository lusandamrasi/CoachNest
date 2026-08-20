import type { SupabaseClient } from '@supabase/supabase-js'

// Coach/client profile rows carry an optional, separately-set contact
// email (see migrations 007/009). Fall back to the account's login email
// when that field hasn't been filled in yet.
export async function resolveEmail(
  admin: SupabaseClient,
  profileEmail: string | null | undefined,
  userId: string,
): Promise<string | null> {
  if (profileEmail) return profileEmail
  const { data } = await admin.auth.admin.getUserById(userId)
  return data?.user?.email ?? null
}
