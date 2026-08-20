import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendBookingAcceptedToClient } from '@/lib/email/templates'
import { formatBookingDate, formatBookingTime } from '@/lib/email/format'
import { resolveEmail } from '@/lib/email/resolveEmail'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// The checkout flow (components/client/CheckoutContent.tsx) doesn't add a
// platform fee on top of the coach's session rate yet — this mirrors that
// so the email never shows a total that disagrees with what's charged.
const BOOKING_FEE = 0

type CoachJoin = {
  sport: string | null
  hourly_rate: number | null
  location: string | null
  profiles: { full_name: string | null } | null
} | null

type ClientJoin = { full_name: string | null; email: string | null } | null

export async function POST(req: NextRequest) {
  const { bookingId } = await req.json()

  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId required' }, { status: 400 })
  }

  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      id, date, start_time, end_time, student_id,
      coach_profiles ( sport, hourly_rate, location, profiles ( full_name ) ),
      profiles!bookings_student_id_fkey ( full_name )
    `)
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !booking) {
    console.error('booking-accepted email: failed to load booking', error)
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const { data: clientProfile } = await supabaseAdmin
    .from('client_profiles')
    .select('email')
    .eq('id', booking.student_id)
    .maybeSingle()

  const clientEmail = await resolveEmail(supabaseAdmin, clientProfile?.email, booking.student_id)

  if (!clientEmail) {
    console.error(`booking-accepted email: no email found for client ${booking.student_id}`)
    return NextResponse.json({ error: 'Client has no email on file' }, { status: 422 })
  }

  const coach = booking.coach_profiles as unknown as CoachJoin
  const client = booking.profiles as unknown as ClientJoin

  const start = new Date(`${booking.date}T${booking.start_time}`)
  const end = new Date(`${booking.date}T${booking.end_time}`)
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  const sessionFee = Math.round((coach?.hourly_rate ?? 0) * hours * 100) / 100
  const total = sessionFee + BOOKING_FEE

  await sendBookingAcceptedToClient({
    to: clientEmail,
    clientName: client?.full_name ?? 'there',
    coachName: coach?.profiles?.full_name ?? 'your coach',
    sport: coach?.sport ?? 'Coaching',
    date: formatBookingDate(booking.date),
    startTime: formatBookingTime(booking.start_time),
    endTime: formatBookingTime(booking.end_time),
    location: coach?.location ?? 'Not specified',
    sessionFee,
    bookingFee: BOOKING_FEE,
    total,
    bookingId: booking.id,
  })

  return NextResponse.json({ success: true })
}
