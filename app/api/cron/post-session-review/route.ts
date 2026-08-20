import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendPostSessionReviewEmail } from '@/lib/email/templates'
import { resolveEmail } from '@/lib/email/resolveEmail'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

type CoachJoin = { profiles: { full_name: string | null } | null } | null
type ClientJoin = { full_name: string | null } | null

function yesterdayDateString(): string {
  // Runs at 10:00 UTC (see vercel.json), which is already past midnight in
  // Africa/Johannesburg (UTC+2), so a plain UTC "yesterday" lines up with
  // the coach's local calendar day.
  const now = new Date()
  now.setUTCDate(now.getUTCDate() - 1)
  return now.toISOString().split('T')[0]
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const dateStr = yesterdayDateString()

  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      id, coach_id, student_id,
      coach_profiles ( profiles ( full_name ) ),
      profiles!bookings_student_id_fkey ( full_name )
    `)
    .eq('date', dateStr)
    .eq('paid', true)
    .eq('status', 'confirmed')

  if (error) {
    console.error('post-session-review cron: failed to load bookings', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  for (const booking of bookings ?? []) {
    const { data: clientProfile } = await supabaseAdmin
      .from('client_profiles')
      .select('email')
      .eq('id', booking.student_id)
      .maybeSingle()

    const clientEmail = await resolveEmail(supabaseAdmin, clientProfile?.email, booking.student_id)
    if (!clientEmail) continue

    const coach = booking.coach_profiles as unknown as CoachJoin
    const client = booking.profiles as unknown as ClientJoin

    await sendPostSessionReviewEmail({
      to: clientEmail,
      clientName: client?.full_name ?? 'there',
      coachName: coach?.profiles?.full_name ?? 'your coach',
      coachId: booking.coach_id,
    })
    sent += 1
  }

  return NextResponse.json({ date: dateStr, candidates: bookings?.length ?? 0, sent })
}
