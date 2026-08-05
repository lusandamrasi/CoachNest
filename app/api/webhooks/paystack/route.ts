import crypto from 'crypto'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendBookingConfirmationToClient, sendBookingNotificationToCoach } from '@/lib/email/templates'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// One paid transaction can cover several sessions at once (the cart-based
// checkout in CheckoutContent.tsx pays for multiple bookings in a single
// Paystack charge), so metadata carries a `cartItems` array rather than a
// single flat booking_id. A single-booking shape is also accepted as a
// fallback for any other place that might initialise a payment directly.
type PaidBookingMeta = {
  booking_id: string
  coach_id: string
  coach_name: string
  sport: string | null
  session_date: string
  session_time: string
  amount: number
}

type PaystackChargeSuccessEvent = {
  event: string
  data: {
    reference: string
    amount: number
    customer?: { email?: string }
    metadata?: {
      client_id?: string
      client_name?: string
      cartItems?: PaidBookingMeta[]
      booking_id?: string
      coach_id?: string
      coach_name?: string
      sport?: string
      session_date?: string
      session_time?: string
    }
  }
}

function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false

  const expected = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest('hex')

  const expectedBuf = Buffer.from(expected, 'hex')
  const signatureBuf = Buffer.from(signature, 'hex')
  if (expectedBuf.length !== signatureBuf.length) return false

  return crypto.timingSafeEqual(expectedBuf, signatureBuf)
}

function extractBookingItems(data: PaystackChargeSuccessEvent['data']): PaidBookingMeta[] {
  const metadata = data.metadata ?? {}

  if (Array.isArray(metadata.cartItems)) {
    return metadata.cartItems.filter((item) => !!item?.booking_id)
  }

  if (metadata.booking_id) {
    return [
      {
        booking_id: metadata.booking_id,
        coach_id: metadata.coach_id ?? '',
        coach_name: metadata.coach_name ?? 'your coach',
        sport: metadata.sport ?? null,
        session_date: metadata.session_date ?? '',
        session_time: metadata.session_time ?? '',
        amount: data.amount / 100,
      },
    ]
  }

  return []
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-paystack-signature')

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: PaystackChargeSuccessEvent
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Only charge.success moves bookings to paid — acknowledge everything
  // else with 200 so Paystack doesn't keep retrying it.
  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  try {
    const { data } = event
    const clientEmail = data.customer?.email
    const clientName = data.metadata?.client_name ?? 'there'
    const bookingItems = extractBookingItems(data)

    for (const item of bookingItems) {
      const { error: updateErr } = await supabaseAdmin
        .from('bookings')
        .update({ paid: true })
        .eq('id', item.booking_id)

      if (updateErr) {
        console.error(`Failed to mark booking ${item.booking_id} as paid:`, updateErr.message)
        continue
      }

      if (clientEmail) {
        await sendBookingConfirmationToClient({
          to: clientEmail,
          clientName,
          coachName: item.coach_name || 'your coach',
          sport: item.sport || 'session',
          sessionDate: item.session_date,
          sessionTime: item.session_time,
          amount: item.amount,
        })
      }

      if (item.coach_id) {
        const { data: coach, error: coachErr } = await supabaseAdmin
          .from('coach_profiles')
          .select('email')
          .eq('id', item.coach_id)
          .maybeSingle()

        if (coachErr) {
          console.error(`Failed to look up email for coach ${item.coach_id}:`, coachErr.message)
        } else if (coach?.email) {
          await sendBookingNotificationToCoach({
            to: coach.email,
            coachName: item.coach_name || 'Coach',
            clientName,
            sessionDate: item.session_date,
            sessionTime: item.session_time,
            amount: item.amount,
          })
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    console.error('Paystack webhook processing error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
