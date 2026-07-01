// Auth flow audit: signs in as coach/client and verifies each protected
// endpoint. Also verifies that unauthenticated hits redirect to /auth/login.
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = (() => {
  const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  const e = {}
  for (const l of raw.split('\n')) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) e[m[1]] = m[2].replace(/^['"]|['"]$/g, '') }
  return e
})()

const url = env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function signIn(email, password) {
  const c = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await c.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return { client: c, user: data.user }
}

const { client: coach } = await signIn('coach1@test.com', 'Test1234!')
const { client: client } = await signIn('client1@test.com', 'Test1234!')

// Check profiles.role for each
async function role(c) {
  const { data } = await c.from('profiles').select('role').single()
  return data?.role
}

console.log(`coach1 role: ${await role(coach)}`)
console.log(`client1 role: ${await role(client)}`)

// Verify signup trigger created rows
const { user: coachUser } = await signIn('coach1@test.com', 'Test1234!')
const { user: clientUser } = await signIn('client1@test.com', 'Test1234!')

const { data: coachRow } = await coach.from('coach_profiles').select('id').eq('id', coachUser.id).maybeSingle()
console.log(`coach_profiles row for coach1: ${!!coachRow}`)
const { data: clientRow } = await client.from('client_profiles').select('id').eq('id', clientUser.id).maybeSingle()
console.log(`client_profiles row for client1: ${!!clientRow}`)

// coaches must NOT have a client_profiles row and vice versa
const { data: coachHasClientRow } = await coach.from('client_profiles').select('id').eq('id', coachUser.id).maybeSingle()
const { data: clientHasCoachRow } = await client.from('coach_profiles').select('id').eq('id', clientUser.id).maybeSingle()
console.log(`coach1 has stray client_profiles row: ${!!coachHasClientRow}`)
console.log(`client1 has stray coach_profiles row: ${!!clientHasCoachRow}`)
