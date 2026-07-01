// End-to-end verification of the booking-note flow.
// 1) ensures coach1 + client1 exist and coach1 has at least one availability slot
// 2) creates a pending booking with a note (as client1)
// 3) verifies the coach can see the note on the pending request
// 4) accepts the booking (status -> confirmed)
// 5) verifies BOTH client and coach can see, on a fresh SELECT, the location,
//    time, counterparty name, and the note for the confirmed booking

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

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

async function signIn(email, password) {
  const c = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await c.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`sign-in ${email} failed: ${error.message}`)
  return { client: c, user: data.user }
}

const NOTE = `book-note probe ${new Date().toISOString()}`
const TEST_LOCATION = 'Stellenbosch, ZA'

console.log('=== setup ===')

const { client: coach, user: coachUser } = await signIn('coach1@test.com', 'Test1234!')
const { client: client, user: clientUser } = await signIn('client1@test.com', 'Test1234!')
console.log(`coach1 = ${coachUser.id}`)
console.log(`client1 = ${clientUser.id}`)

// Make sure coach has the location we'll assert on
await admin.from('coach_profiles').update({ location: TEST_LOCATION }).eq('id', coachUser.id)

// Ensure at least one availability slot exists — pick day_of_week from a future date
const future = new Date()
future.setDate(future.getDate() + 7)
const bookingDate = future.toISOString().split('T')[0]
const dayOfWeek = future.getDay()
const startTime = '09:00:00'
const endTime = '10:00:00'

const { data: existingSlots } = await admin
  .from('availability')
  .select('id')
  .eq('coach_id', coachUser.id)
  .eq('day_of_week', dayOfWeek)
  .eq('start_time', startTime)
  .limit(1)

if (!existingSlots || existingSlots.length === 0) {
  const { error: slotErr } = await admin.from('availability').insert({
    coach_id: coachUser.id,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
    num_clients: 1,
    notes: null,
  })
  if (slotErr) throw new Error(`availability insert: ${slotErr.message}`)
  console.log(`  inserted availability slot day=${dayOfWeek} ${startTime}–${endTime}`)
} else {
  console.log(`  slot already present`)
}

// Clean up any prior probe bookings between this pair on this date
await admin
  .from('bookings')
  .delete()
  .eq('coach_id', coachUser.id)
  .eq('student_id', clientUser.id)
  .eq('date', bookingDate)
  .eq('start_time', startTime)

console.log()
console.log('=== 1) client creates pending booking with note ===')

const { data: created, error: bookErr } = await client
  .from('bookings')
  .insert({
    coach_id: coachUser.id,
    student_id: clientUser.id,
    date: bookingDate,
    start_time: startTime,
    end_time: endTime,
    status: 'pending',
    paid: false,
    notes: NOTE,
  })
  .select('id, notes, status')
  .single()

if (bookErr) {
  console.error('insert failed:', bookErr.code, bookErr.message)
  process.exit(2)
}
console.log(`  booking ${created.id} status=${created.status} notes="${created.notes}"`)
const bookingId = created.id

console.log()
console.log('=== 2) coach sees note on pending request ===')

const { data: pending, error: pendErr } = await coach
  .from('bookings')
  .select(`id, status, notes, profiles!bookings_student_id_fkey ( full_name )`)
  .eq('coach_id', coachUser.id)
  .eq('id', bookingId)
  .single()

if (pendErr) { console.error('coach pending SELECT failed:', pendErr.message); process.exit(3) }
console.log(`  client: ${pending.profiles?.full_name}`)
console.log(`  note seen by coach: "${pending.notes}"`)
if (pending.notes !== NOTE) { console.error('  ✗ note mismatch'); process.exit(4) }

console.log()
console.log('=== 3) coach accepts booking (status -> confirmed) ===')

const { error: updErr } = await coach.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId)
if (updErr) { console.error('update failed:', updErr.message); process.exit(5) }
console.log('  ✓ confirmed')

console.log()
console.log('=== 4) coach calendar view: location, time, name, note ===')

const { data: coachView, error: coachViewErr } = await coach
  .from('bookings')
  .select(`id, date, start_time, end_time, notes,
           profiles!bookings_student_id_fkey ( full_name )`)
  .eq('id', bookingId)
  .single()
if (coachViewErr) { console.error(coachViewErr.message); process.exit(6) }

const { data: coachLocRow } = await coach.from('coach_profiles').select('location').eq('id', coachUser.id).single()

const coachSeesOk =
  !!coachView.profiles?.full_name &&
  coachLocRow?.location === TEST_LOCATION &&
  coachView.start_time?.startsWith('09:00') &&
  coachView.notes === NOTE

console.log(`  client name : ${coachView.profiles?.full_name}`)
console.log(`  location    : ${coachLocRow?.location}`)
console.log(`  time        : ${coachView.start_time} – ${coachView.end_time}`)
console.log(`  note        : "${coachView.notes}"`)
console.log(`  ${coachSeesOk ? '✓' : '✗'} coach side fully visible`)

console.log()
console.log('=== 5) client calendar view: location, time, name, note ===')

const { data: clientView, error: clientViewErr } = await client
  .from('bookings')
  .select(`id, date, start_time, end_time, notes,
           coach_profiles ( location, profiles ( full_name ) )`)
  .eq('id', bookingId)
  .single()
if (clientViewErr) { console.error(clientViewErr.message); process.exit(7) }

const coachProfilesObj = Array.isArray(clientView.coach_profiles)
  ? clientView.coach_profiles[0]
  : clientView.coach_profiles
const coachInnerProfiles = Array.isArray(coachProfilesObj?.profiles)
  ? coachProfilesObj.profiles[0]
  : coachProfilesObj?.profiles

const clientSeesOk =
  !!coachInnerProfiles?.full_name &&
  coachProfilesObj?.location === TEST_LOCATION &&
  clientView.start_time?.startsWith('09:00') &&
  clientView.notes === NOTE

console.log(`  coach name  : ${coachInnerProfiles?.full_name}`)
console.log(`  location    : ${coachProfilesObj?.location}`)
console.log(`  time        : ${clientView.start_time} – ${clientView.end_time}`)
console.log(`  note        : "${clientView.notes}"`)
console.log(`  ${clientSeesOk ? '✓' : '✗'} client side fully visible`)

if (!coachSeesOk || !clientSeesOk) process.exit(8)

console.log()
console.log('=== ALL CHECKS PASSED ===')
