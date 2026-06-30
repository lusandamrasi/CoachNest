// Probe each individual RLS path with a signed-in client to find the broken one.
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  return env
}

const env = loadEnv()
const url = env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

const user = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const email = 'client1@test.com'
const password = 'Test1234!'

const { data: signIn, error: signInErr } = await user.auth.signInWithPassword({ email, password })
if (signInErr) { console.error('sign-in failed:', signInErr.message); process.exit(1) }
const userId = signIn.user.id
console.log(`signed in: ${userId}\n`)

async function probe(label, fn) {
  console.log(`▶ ${label}`)
  try {
    const { data, error, status, statusText } = await fn()
    if (error) {
      console.log(`  ✗ ${status} ${statusText}  code=${error.code}  ${error.message}`)
    } else {
      console.log(`  ✓ rows=${Array.isArray(data) ? data.length : data ? 1 : 0}`)
    }
  } catch (e) {
    console.log(`  ✗ THREW: ${e.message}`)
  }
  console.log('')
}

// 1) SELECT with user JWT
await probe('user SELECT id=userId', () =>
  user.from('client_profiles').select('id, bio').eq('id', userId).maybeSingle())

// 2) Does row already exist? Check via admin
const { data: existing } = await admin.from('client_profiles').select('id').eq('id', userId).maybeSingle()
console.log(`admin says row exists: ${!!existing}\n`)

// 3) Plain UPDATE with user JWT (only meaningful if row exists)
await probe('user UPDATE bio', () =>
  user.from('client_profiles').update({ bio: 'probe-update' }).eq('id', userId).select('id'))

// 4) Plain INSERT with user JWT — only safe if row absent. Delete first via admin.
console.log('▶ admin DELETE row to test pure INSERT')
const { error: delErr } = await admin.from('client_profiles').delete().eq('id', userId)
console.log(`  delete err: ${delErr?.message ?? 'none'}\n`)

await probe('user INSERT { id }', () =>
  user.from('client_profiles').insert({ id: userId }).select('id'))

// 5) Plain UPSERT with user JWT (row now exists from step 4 if it succeeded)
await probe('user UPSERT { id, bio }', () =>
  user.from('client_profiles').upsert({ id: userId, bio: 'probe-upsert' }, { onConflict: 'id' }).select('id'))

// 6) UPSERT with more fields like the real form
await probe('user UPSERT full payload', () =>
  user.from('client_profiles').upsert({
    id: userId,
    bio: 'probe-full',
    location: 'Cape Town',
    location_lat: -33.92,
    location_lng: 18.42,
    travel_radius_km: 10,
    is_parent: false,
    age: 30,
    preferred_sports: ['Tennis'],
    languages_spoken: ['English'],
    experience_levels: ['Beginner'],
    coaching_types: ['Private'],
    email,
    phone_number: '+27',
  }, { onConflict: 'id' }).select('id'))

// 7) UPSERT done via the admin client (RLS-bypass) to verify the data itself is valid
await probe('admin UPSERT full payload', () =>
  admin.from('client_profiles').upsert({
    id: userId,
    bio: 'admin-upsert',
  }, { onConflict: 'id' }).select('id'))
