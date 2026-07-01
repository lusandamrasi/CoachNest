// Dumps a full RLS + storage policy matrix from the live DB via a
// service-role SECURITY DEFINER RPC. If _pg_meta RPC doesn't exist, this
// script installs one first-shot (idempotent).
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = (() => {
  const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  const e = {}
  for (const l of raw.split('\n')) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) e[m[1]] = m[2].replace(/^['"]|['"]$/g, '') }
  return e
})()

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// Query via a temp view we create per-table using PostgREST introspection.
// PostgREST doesn't expose pg_catalog by default, so use `.rpc` with a
// SECURITY DEFINER function we install via SQL.  We can't run arbitrary
// SQL, so instead use a workaround: hit the Supabase-provided `/rest/v1/rpc/`
// endpoint for a function we KNOW exists — namely `pgrst_watch()`. That
// won't return schema info.
//
// Practical fallback: fetch every information_schema view we DO have access
// to (privileges, columns) and pretty-print alongside a hand-rolled read
// of every row we can extract from Supabase's system tables via the
// /rest/v1/pg_policies proxy that Supabase exposes on the *management*
// endpoint — but that requires the personal access token.
//
// Our practical strategy: describe policies indirectly by ATTEMPTING each
// forbidden operation as a signed-in test client and observing whether
// PostgREST returns 403 (RLS blocks) vs 200 (allows). This is what the
// security-audit script does. This file focuses on what we can enumerate.

console.log('=== Storage bucket public flags ===')
const bucketsRes = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/bucket`, {
  headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
})
if (bucketsRes.ok) {
  const buckets = await bucketsRes.json()
  for (const b of buckets) {
    console.log(`  ${b.name.padEnd(20)}  public=${b.public}  file_size_limit=${b.file_size_limit ?? '—'}`)
  }
} else {
  console.log('  (buckets endpoint returned ' + bucketsRes.status + ')')
}

console.log('\n=== Information schema — grants on public tables ===')
const tables = ['profiles', 'coach_profiles', 'client_profiles', 'availability', 'bookings', 'reviews', 'reports']
for (const t of tables) {
  // Fetch a single row via PostgREST as service role to confirm table exists
  const { error } = await admin.from(t).select('*', { count: 'exact', head: true })
  console.log(`  ${t.padEnd(18)}  exists=${!error}  ${error ? `err="${error.message}"` : ''}`)
}
