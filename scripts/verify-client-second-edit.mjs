// Second-edit verification: confirms the UPDATE path of upsert
// (ON CONFLICT DO UPDATE) works for a client whose row already exists.
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

const supa = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: signIn, error: signInErr } = await supa.auth.signInWithPassword({
  email: 'client1@test.com',
  password: 'Test1234!',
})
if (signInErr) { console.error('sign-in failed:', signInErr.message); process.exit(1) }
const userId = signIn.user.id
console.log(`signed in: ${userId}`)

// Read existing state with the user's JWT (proves SELECT policy works now too)
const { data: before, error: beforeErr } = await supa
  .from('client_profiles')
  .select('id, bio, age, location, preferred_sports, languages_spoken')
  .eq('id', userId)
  .single()
if (beforeErr) {
  console.error('user SELECT failed:', beforeErr.code, beforeErr.message)
  process.exit(2)
}
console.log('\nbefore edit:')
console.log(JSON.stringify(before, null, 2))

// Perform a meaningful edit — change bio, age, add a language, swap a sport.
const editedBio = `Edit @ ${new Date().toISOString()}`
const editedAge = (before.age ?? 30) + 1
const editedLangs = Array.from(new Set([...(before.languages_spoken ?? []), 'Zulu']))
const editedSports = Array.from(new Set([...(before.preferred_sports ?? []), 'Soccer']))

const payload = {
  id: userId,
  bio: editedBio,
  age: editedAge,
  location: 'Stellenbosch, ZA',
  languages_spoken: editedLangs,
  preferred_sports: editedSports,
}

console.log('\n→ upsert (UPDATE path — row exists)')
const { data: after, error: upErr, status, statusText } = await supa
  .from('client_profiles')
  .upsert(payload, { onConflict: 'id' })
  .select('id, bio, age, location, preferred_sports, languages_spoken')
  .single()

if (upErr) {
  console.error(`UPSERT FAILED (status ${status} ${statusText}):`)
  console.error('  code:    ', upErr.code)
  console.error('  message: ', upErr.message)
  process.exit(3)
}

console.log('✓ upsert succeeded (UPDATE path)')
console.log('\nafter edit:')
console.log(JSON.stringify(after, null, 2))

// Strict equality assertions
const expected = {
  id: userId,
  bio: editedBio,
  age: editedAge,
  location: 'Stellenbosch, ZA',
}
let allMatch = true
for (const [k, v] of Object.entries(expected)) {
  if (after[k] !== v) {
    console.error(`✗ MISMATCH ${k}: expected ${JSON.stringify(v)}, got ${JSON.stringify(after[k])}`)
    allMatch = false
  }
}
if (!Array.isArray(after.languages_spoken) || !editedLangs.every((l) => after.languages_spoken.includes(l))) {
  console.error('✗ languages_spoken mismatch')
  allMatch = false
}
if (!Array.isArray(after.preferred_sports) || !editedSports.every((s) => after.preferred_sports.includes(s))) {
  console.error('✗ preferred_sports mismatch')
  allMatch = false
}

if (!allMatch) process.exit(4)
console.log('\n✓ all edited fields persisted exactly')
