// Reproduces the client edit-profile save with a seeded test client.
// Run: node scripts/verify-client-upsert.mjs [email] [password]
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
if (!url || !anonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const email = process.argv[2] ?? 'client1@test.com'
const password = process.argv[3] ?? 'Test1234!'

const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

console.log(`→ signing in as ${email}`)
const { data: signIn, error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
if (signInErr) {
  console.error('SIGN-IN FAILED:', signInErr.message)
  process.exit(2)
}
const userId = signIn.user.id
console.log(`  signed in. user.id = ${userId}`)

const { data: userData } = await supabase.auth.getUser()
console.log(`  auth.getUser() id = ${userData?.user?.id}`)
console.log(`  session.access_token len = ${signIn.session?.access_token?.length}`)

const payload = {
  id: userId,
  bio: 'Test bio from verify script',
  location: 'Cape Town, ZA',
  location_lat: -33.9249,
  location_lng: 18.4241,
  travel_radius_km: 25,
  is_parent: false,
  age: 30,
  preferred_sports: ['Tennis', 'Yoga'],
  languages_spoken: ['English', 'Afrikaans'],
  experience_levels: ['Beginner', 'Intermediate'],
  coaching_types: ['Private', 'Online'],
  email,
  phone_number: '+27 82 000 0000',
}

console.log('→ upsert client_profiles { onConflict: id }')
const { data: upserted, error: upsertErr, status, statusText } = await supabase
  .from('client_profiles')
  .upsert(payload, { onConflict: 'id' })
  .select('id, bio, age, preferred_sports')

if (upsertErr) {
  console.error(`UPSERT FAILED (status ${status} ${statusText}):`)
  console.error('  code:    ', upsertErr.code)
  console.error('  message: ', upsertErr.message)
  console.error('  details: ', upsertErr.details)
  console.error('  hint:    ', upsertErr.hint)
  process.exit(3)
}

console.log('✓ upsert succeeded')
console.log('  returned row:', JSON.stringify(upserted, null, 2))
process.exit(0)
