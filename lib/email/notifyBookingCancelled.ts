import type { SupabaseClient } from '@supabase/supabase-js'
import { sendBookingCancelledEmail } from '@/lib/email/templates'
import { formatBookingDate, formatBookingTime } from '@/lib/email/format'
import { resolveEmail } from '@/lib/email/resolveEmail'

type CoachJoin = {
  sport: string | null
  hourly_rate: number | null
  email: string | null
  profiles: { full_name: string | null } | null
} | null

type ClientJoin = { full_name: string | null } | null

// Shared by app/api/email/booking-cancelled/route.ts (called from
// client-side cancellation flows) and app/api/bookings/cancel/route.ts
// (already server-side, so it calls this directly instead of round-tripping
// through its own deployment over HTTP).
export async function notifyBookingCancelled(
  admin: SupabaseClient,
  bookingId: string,
  cancelledBy: 'client' | 'coach',
  reason?: string | null,
) {
  const { data: booking, error } = await admin
    .from('bookings')
    .select(`
      id, date, start_time, end_time, coach_id, student_id, paid,
      coach_profiles ( sport, hourly_rate, email, profiles ( full_name ) ),
      profiles!bookings_student_id_fkey ( full_name )
    `)
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !booking) {
    console.error('notifyBookingCancelled: failed to load booking', error)
    return
  }

  const { data: clientProfile } = await admin
    .from('client_profiles')
    .select('email')
    .eq('id', booking.student_id)
    .maybeSingle()

  const coach = booking.coach_profiles as unknown as CoachJoin
  const client = booking.profiles as unknown as ClientJoin

  const coachEmail = await resolveEmail(admin, coach?.email, booking.coach_id)
  const clientEmail = await resolveEmail(admin, clientProfile?.email, booking.student_id)

  const coachName = coach?.profiles?.full_name ?? 'Coach'
  const clientName = client?.full_name ?? 'Client'
  const sport = coach?.sport ?? 'Coaching'
  const date = formatBookingDate(booking.date)
  const startTime = formatBookingTime(booking.start_time)
  const endTime = formatBookingTime(booking.end_time)

  const start = new Date(`${booking.date}T${booking.start_time}`)
  const end = new Date(`${booking.date}T${booking.end_time}`)
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  const refundAmount = booking.paid ? Math.round((coach?.hourly_rate ?? 0) * hours * 100) / 100 : null

  if (clientEmail) {
    await sendBookingCancelledEmail({
      to: clientEmail,
      name: clientName,
      otherPersonName: coachName,
      role: 'client',
      sport, date, startTime, endTime,
      bookingId: booking.id,
      cancelledBy,
      reason,
      refundAmount,
    })
  }

  if (coachEmail) {
    await sendBookingCancelledEmail({
      to: coachEmail,
      name: coachName,
      otherPersonName: clientName,
      role: 'coach',
      sport, date, startTime, endTime,
      bookingId: booking.id,
      cancelledBy,
      reason,
      refundAmount,
    })
  }
}
