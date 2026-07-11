import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
    const { reference, bookingId } = await req.json()

    if (!reference || !bookingId) {
        return NextResponse.json({ error: 'Missing reference or bookingId' }, { status: 400 })
    }

    // Verify transaction with Paystack
    const paystackRes = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
        }
    )

    const paystackData = await paystackRes.json()

    if (!paystackRes.ok || paystackData.data?.status !== 'success') {
        return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
    }

    // Mark booking as paid
    const { error } = await supabaseAdmin
        .from('bookings')
        .update({ paid: true})
        .eq('id', bookingId)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}