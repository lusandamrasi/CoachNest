import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email/templates'
import type { UserRole } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { name, email, role } = await req.json()

  if (!name || !email || (role !== 'client' && role !== 'coach')) {
    return NextResponse.json({ error: 'name, email and a valid role are required' }, { status: 400 })
  }

  await sendWelcomeEmail({ to: email, name, role: role as UserRole })

  return NextResponse.json({ success: true })
}
