import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notifyBookingCancelled } from '@/lib/email/notifyBookingCancelled'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  const { bookingId, cancelledBy, reason } = await req.json()

  if (!bookingId || (cancelledBy !== 'client' && cancelledBy !== 'coach')) {
    return NextResponse.json({ error: 'bookingId and a valid cancelledBy are required' }, { status: 400 })
  }

  await notifyBookingCancelled(supabaseAdmin, bookingId, cancelledBy, reason)

  return NextResponse.json({ success: true })
}
