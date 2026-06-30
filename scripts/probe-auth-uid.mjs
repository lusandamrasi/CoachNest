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

const { data: signIn, error } = await supa.auth.signInWithPassword({
  email: 'client1@test.com',
  password: 'Test1234!',
})
if (error) { console.error(error.message); process.exit(1) }

const token = signIn.session.access_token
const userId = signIn.user.id
console.log('user.id:', userId)
console.log()

// Decode JWT payload
const [, payloadB64] = token.split('.')
const payload = JSON.parse(Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'))
console.log('JWT payload:')
console.log(JSON.stringify(payload, null, 2))
console.log()

// Compare sub vs user.id
console.log('sub === user.id?', payload.sub === userId)
console.log()

// Probe profiles (a different table) — can the user SELECT / UPDATE their own row?
console.log('▶ user SELECT profiles where id = self')
{
  const { data, error } = await supa.from('profiles').select('id, full_name, role').eq('id', userId).maybeSingle()
  console.log('  ', error ? `ERR ${error.code} ${error.message}` : `row=${JSON.stringify(data)}`)
}
console.log('▶ user UPDATE profiles set full_name (no-op) where id = self')
{
  const { data, error } = await supa.from('profiles').update({ full_name: signIn.user.user_metadata?.full_name ?? 'Test Client' }).eq('id', userId).select('id')
  console.log('  ', error ? `ERR ${error.code} ${error.message}` : `rows=${data?.length ?? 0}`)
}
console.log()

// Hit raw REST endpoint to see full headers and response
console.log('▶ raw REST: POST client_profiles upsert')
const res = await fetch(`${url}/rest/v1/client_profiles?on_conflict=id`, {
  method: 'POST',
  headers: {
    apikey: anonKey,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=representation',
  },
  body: JSON.stringify({ id: userId, bio: 'raw-rest probe' }),
})
console.log('  status:', res.status, res.statusText)
console.log('  body:  ', await res.text())
