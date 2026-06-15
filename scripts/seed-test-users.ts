/* eslint-disable no-console */
/**
 * Seeds 7 test clients + 7 test coaches via the Supabase admin API.
 *
 *   npm run seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Minimal .env.local loader so we don't need to install dotenv.
function loadEnvLocal() {
  try {
    const raw = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim().replace(/^"|"$/g, '')
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // .env.local missing — fall through and let the env-var check fail loudly.
  }
}

loadEnvLocal()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PASSWORD = 'Test1234!'
const SPORTS = ['Tennis', 'Basketball', 'Yoga', 'Golf', 'Soccer', 'Swimming', 'Boxing']

type SeedUser = {
  email: string
  password: string
  email_confirm: true
  user_metadata: Record<string, string>
}

const clients: SeedUser[] = Array.from({ length: 7 }, (_, i) => ({
  email: `client${i + 1}@test.com`,
  password: PASSWORD,
  email_confirm: true,
  user_metadata: {
    full_name: `Test Client ${i + 1}`,
    role: 'client',
  },
}))

const coaches: SeedUser[] = Array.from({ length: 7 }, (_, i) => ({
  email: `coach${i + 1}@test.com`,
  password: PASSWORD,
  email_confirm: true,
  user_metadata: {
    full_name: `Test Coach ${i + 1}`,
    role: 'coach',
    sport: SPORTS[i],
  },
}))

async function createUser(u: SeedUser) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: u.email_confirm,
    user_metadata: u.user_metadata,
  })

  if (error) {
    console.error(`  ✗ ${u.email} — ${error.message}`)
    return null
  }
  console.log(`  ✓ ${u.email}  →  ${data.user?.id}`)
  return data.user?.id ?? null
}

async function main() {
  console.log('\nSeeding clients:')
  for (const u of clients) await createUser(u)

  console.log('\nSeeding coaches:')
  for (const u of coaches) await createUser(u)

  console.log('\nVerifying DB state:')

  const { count: profileCount, error: pErr } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
  if (pErr) console.error('  profiles count failed:', pErr.message)
  else console.log(`  profiles rows:        ${profileCount}`)

  const { count: coachCount, error: cErr } = await supabase
    .from('coach_profiles')
    .select('*', { count: 'exact', head: true })
  if (cErr) console.error('  coach_profiles count failed:', cErr.message)
  else console.log(`  coach_profiles rows:  ${coachCount}`)

  const { data: nullRoles, error: nrErr } = await supabase
    .from('profiles')
    .select('id, full_name')
    .is('role', null)
  if (nrErr) console.error('  null-role check failed:', nrErr.message)
  else if (nullRoles && nullRoles.length > 0) {
    console.error(`  ✗ ${nullRoles.length} profile(s) have null role:`)
    for (const r of nullRoles) console.error(`      ${r.id}  ${r.full_name}`)
  } else {
    console.log('  ✓ no null roles in profiles')
  }

  const { data: coachIds, error: ciErr } = await supabase
    .from('coach_profiles')
    .select('id')
  if (ciErr) {
    console.error('  coach id fetch failed:', ciErr.message)
  } else if (coachIds && coachIds.length > 0) {
    const ids = coachIds.map((r) => r.id)
    const { data: matching, error: mErr } = await supabase
      .from('profiles')
      .select('id, role')
      .in('id', ids)
    if (mErr) {
      console.error('  matching-profile check failed:', mErr.message)
    } else {
      const byId = new Map(matching?.map((m) => [m.id, m.role]) ?? [])
      const mismatches = ids.filter((id) => byId.get(id) !== 'coach')
      if (mismatches.length === 0) {
        console.log('  ✓ every coach_profile has a matching profiles row with role=coach')
      } else {
        console.error(`  ✗ ${mismatches.length} coach_profile(s) missing matching coach role:`)
        for (const id of mismatches) console.error(`      ${id}  (profiles.role = ${byId.get(id) ?? 'MISSING'})`)
      }
    }
  }

  console.log('')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
