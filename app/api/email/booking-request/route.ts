import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendNewBookingRequestToCoach } from '@/lib/email/templates'
import { formatBookingDate, formatBookingTime } from '@/lib/email/format'
import { resolveEmail } from '@/lib/email/resolveEmail'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

type CoachJoin = {
  sport: string | null
  hourly_rate: number | null
  location: string | null
  email: string | null
  profiles: { full_name: string | null } | null
} | null

type ClientJoin = { full_name: string | null } | null

export async function POST(req: NextRequest) {
  const { bookingId } = await req.json()

  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId required' }, { status: 400 })
  }

  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      id, date, start_time, end_time, notes, coach_id,
      coach_profiles ( sport, hourly_rate, location, email, profiles ( full_name ) ),
      profiles!bookings_student_id_fkey ( full_name )
    `)
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !booking) {
    console.error('booking-request email: failed to load booking', error)
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const coach = booking.coach_profiles as unknown as CoachJoin
  const client = booking.profiles as unknown as ClientJoin

  const coachEmail = await resolveEmail(supabaseAdmin, coach?.email, booking.coach_id)

  if (!coachEmail) {
    console.error(`booking-request email: no email found for coach ${booking.coach_id}`)
    return NextResponse.json({ error: 'Coach has no email on file' }, { status: 422 })
  }

  await sendNewBookingRequestToCoach({
    to: coachEmail,
    coachName: coach?.profiles?.full_name ?? 'Coach',
    clientName: client?.full_name ?? 'A client',
    sport: coach?.sport ?? 'Coaching',
    date: formatBookingDate(booking.date),
    startTime: formatBookingTime(booking.start_time),
    endTime: formatBookingTime(booking.end_time),
    location: coach?.location ?? 'Not specified',
    hourlyRate: coach?.hourly_rate ?? 0,
    clientMessage: booking.notes,
    bookingId: booking.id,
  })

  return NextResponse.json({ success: true })
}
