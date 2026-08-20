import { NextRequest, NextResponse } from 'next/server'

// Stub only — payout processing (Paystack splits/transfers) isn't built
// yet, so there's nothing to summarize per coach. This route exists and is
// scheduled so the cron slot is reserved; wire it up to sendCoachWeeklyPayoutEmail
// once payouts are actually computed.
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  console.log('Payout emails pending payment integration')

  return NextResponse.json({ status: 'pending payment integration' })
}
