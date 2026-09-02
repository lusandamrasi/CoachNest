import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/isAdmin'
import { createServiceClient } from '@/lib/supabase/service'
import { sendVerificationStatusEmail } from '@/lib/email/templates'

const VALID_STATUSES = ['id_verified', 'qualification_verified', 'verified'] as const
type NewStatus = (typeof VALID_STATUSES)[number]

export async function POST(req: NextRequest) {
  const isAdmin = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { coachId, newStatus } = await req.json()

  if (!coachId || !newStatus) {
    return NextResponse.json({ error: 'Missing coachId or newStatus' }, { status: 400 })
  }
  if (!VALID_STATUSES.includes(newStatus)) {
    return NextResponse.json({ error: 'Invalid newStatus' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('coach_profiles')
    .update({ verification_status: newStatus })
    .eq('id', coachId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    const { data: coach } = await supabase
      .from('coach_profiles')
      .select('email, profiles!coach_profiles_id_fkey ( full_name )')
      .eq('id', coachId)
      .single()

    const profile = coach?.profiles as unknown as { full_name: string | null } | null
    const coachName = profile?.full_name ?? 'Coach'
    let coachEmail = coach?.email ?? null

    if (!coachEmail) {
      const { data: authUser } = await supabase.auth.admin.getUserById(coachId)
      coachEmail = authUser?.user?.email ?? null
    }

    if (coachEmail) {
      await sendVerificationStatusEmail({ to: coachEmail, coachName, status: newStatus as NewStatus })
      console.log(`verify-coach: sent verification status email to ${coachEmail} for coach ${coachId} (status: ${newStatus})`)
    } else {
      console.warn(`verify-coach: could not send verification status email — no email found for coach ${coachId}`)
    }
  } catch (emailErr) {
    console.error(`verify-coach: failed to send verification status email for coach ${coachId}:`, emailErr)
  }

  return NextResponse.json({ success: true, coachId, newStatus })
}
