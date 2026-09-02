import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationStatusEmail } from '@/lib/email/templates'

export async function POST(req: NextRequest) {
  const { to, coachName, status } = await req.json()

  if (!to || !coachName || !status) {
    return NextResponse.json({ error: 'Missing to, coachName, or status' }, { status: 400 })
  }

  const result = await sendVerificationStatusEmail({ to, coachName, status })
  return NextResponse.json({ success: true, result })
}
