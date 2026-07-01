// Signs in as client1/coach1 and probes each hostile RLS path that
// SHOULD be rejected. Prints PASS/FAIL per check.
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = (() => {
  const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  const e = {}
  for (const l of raw.split('\n')) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) e[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  return e
})()

const url = env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

async function signIn(email, password) {
  const c = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await c.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`sign-in ${email}: ${error.message}`)
  return { client: c, user: data.user }
}

async function bearer(client) {
  return (await client.auth.getSession()).data.session.access_token
}

const results = []
function record(name, expected, got, detail) {
  results.push({ name, expected, got, detail })
}

const { client: client1, user: client1User } = await signIn('client1@test.com', 'Test1234!')
const { client: coach1, user: coach1User } = await signIn('coach1@test.com', 'Test1234!')
const { user: client2User } = await signIn('client2@test.com', 'Test1234!')

console.log(`client1 = ${client1User.id}`)
console.log(`client2 = ${client2User.id}`)
console.log(`coach1  = ${coach1User.id}\n`)

// 1. client1 tries to update client2's profiles row
{
  const { data, error } = await client1
    .from('profiles').update({ full_name: 'HIJACKED' }).eq('id', client2User.id).select('id')
  const rejected = !!error || (Array.isArray(data) && data.length === 0)
  record("client1 updates another user's profiles row",
    'reject', rejected ? 'rejected' : 'allowed', error?.message ?? `rows=${data?.length}`)
}

// 2. client1 tries to insert a review with mismatched client_id
{
  const { error } = await client1.from('reviews').insert({
    coach_id: coach1User.id, client_id: client2User.id, rating: 5, review_text: 'block me',
  })
  record('client1 inserts review with mismatched client_id',
    'reject', error ? 'rejected' : 'allowed', error?.message)
}

// 3. client1 tries to read coach-documents for another user's folder
{
  const token = await bearer(client1)
  const res = await fetch(`${url}/storage/v1/object/coach-documents/${coach1User.id}/probe.txt`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  })
  const rejected = res.status >= 400
  record("client1 reads coach-documents for another user's folder",
    'reject', rejected ? 'rejected' : 'allowed', `status=${res.status}`)
}

// 4. client1 tries to update coach_profiles
{
  const { data, error } = await client1
    .from('coach_profiles').update({ bio: 'HIJACKED' }).eq('id', coach1User.id).select('id')
  const rejected = !!error || (Array.isArray(data) && data.length === 0)
  record('client1 updates a coach_profiles row',
    'reject', rejected ? 'rejected' : 'allowed', error?.message ?? `rows=${data?.length}`)
}

// 5. coach1 tries to insert a review (informational — UI-side)
{
  const { error } = await coach1.from('reviews').insert({
    coach_id: coach1User.id, client_id: coach1User.id, rating: 5, review_text: 'block me',
  })
  record('coach1 (role=coach) inserts a self-review',
    'reject', error ? 'rejected' : 'allowed',
    error?.message ?? '(RLS only checks client_id=uid — UI hides the form for coaches)')
  if (!error) await admin.from('reviews').delete().eq('coach_id', coach1User.id).eq('client_id', coach1User.id)
}

// 6. coach1 tries to update a client_profiles row
{
  const { data, error } = await coach1
    .from('client_profiles').update({ bio: 'HIJACKED' }).eq('id', client1User.id).select('id')
  const rejected = !!error || (Array.isArray(data) && data.length === 0)
  record('coach1 updates a client_profiles row',
    'reject', rejected ? 'rejected' : 'allowed', error?.message ?? `rows=${data?.length}`)
}

// 7. anon reads reports
{
  const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await anon.from('reports').select('*').limit(1)
  const rejected = !!error || (Array.isArray(data) && data.length === 0)
  record('anon reads reports table', 'reject',
    rejected ? 'rejected' : 'allowed', error?.message ?? `rows=${data?.length}`)
}

// 8. client1 reads reports
{
  const { data, error } = await client1.from('reports').select('*').limit(1)
  const rejected = !!error || (Array.isArray(data) && data.length === 0)
  record('authenticated client reads reports table', 'reject',
    rejected ? 'rejected' : 'allowed', error?.message ?? `rows=${data?.length}`)
}

// 9. client1 uploads to coach-documents/<own folder> (informational)
{
  const token = await bearer(client1)
  const blob = new Blob(['test'], { type: 'text/plain' })
  const res = await fetch(
    `${url}/storage/v1/object/coach-documents/${client1User.id}/probe.txt`,
    { method: 'POST', headers: { apikey: anonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain', 'x-upsert': 'true' }, body: blob }
  )
  record('client1 uploads to coach-documents/<own folder>',
    'reject', res.ok ? 'allowed' : 'rejected',
    `status=${res.status} (RLS only checks folder=uid; role check is app-side)`)
  if (res.ok) await admin.storage.from('coach-documents').remove([`${client1User.id}/probe.txt`])
}

console.log('| # | Check | Expected | Actual | Result |')
console.log('|---|-------|----------|--------|--------|')
let failed = 0
results.forEach((r, i) => {
  const ok = r.expected === 'reject' ? r.got === 'rejected' : r.got === 'allowed'
  if (!ok) failed++
  console.log(`| ${i + 1} | ${r.name} | ${r.expected} | ${r.got} | ${ok ? '✓ PASS' : '✗ FAIL'} | ${r.detail ? '_'+r.detail+'_' : ''}`)
})
console.log(`\n${failed === 0 ? '✓ ALL PASSED' : `✗ ${failed} FAILED`}`)
process.exit(failed === 0 ? 0 : 1)
