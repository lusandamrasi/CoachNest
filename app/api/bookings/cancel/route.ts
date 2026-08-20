import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { notifyBookingCancelled } from '@/lib/email/notifyBookingCancelled'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  const { bookingId } = await req.json()

  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId required' }, { status: 400 })
  }

  const supabase = createClient()
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()

  if (authErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: booking, error: fetchErr } = await supabaseAdmin
    .from('bookings')
    .select('id, coach_id, student_id, status, paid')
    .eq('id', bookingId)
    .maybeSingle()

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }
  if (booking.coach_id !== user.id && booking.student_id !== user.id) {
    return NextResponse.json({ error: 'You do not have access to this booking' }, { status: 403 })
  }
  if (booking.status !== 'confirmed' || booking.paid) {
    return NextResponse.json(
      { error: 'Only confirmed, unpaid bookings can be cancelled this way' },
      { status: 409 },
    )
  }

  const { error: updateErr } = await supabaseAdmin
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  const cancelledBy = booking.coach_id === user.id ? 'coach' : 'client'
  notifyBookingCancelled(supabaseAdmin, bookingId, cancelledBy).catch((err) =>
    console.error('Failed to send booking cancelled emails:', err),
  )

  return NextResponse.json({ success: true })
}
