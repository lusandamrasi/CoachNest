'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, ShieldCheck, ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/hooks/useCart'
import PaystackPop  from '@paystack/inline-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function formatTime(time: string) {
  return time.slice(0, 5)
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

function sessionAmount(item: { date: string; start_time: string; end_time: string; coach_profiles: { hourly_rate: number | null } | null }) {
  const start = new Date(`${item.date}T${item.start_time}`)
  const end = new Date(`${item.date}T${item.end_time}`)
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  return (item.coach_profiles?.hourly_rate ?? 0) * hours
}

export default function CheckoutContent() {
  const router = useRouter()
  const { cartItems, cartCount, cartTotal, isLoading } = useCart()
  const [toast, setToast] = useState<string | null>(null)

  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email ?? null)
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      setUserName(profile?.full_name ?? null)
    }
    loadUser()
  }, [])

  function handlePay() {
    if (!userEmail || cartItems.length === 0) return

    const paystack = new PaystackPop()
    paystack.newTransaction({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email: userEmail,
      amount: Math.round(cartTotal * 100),
      currency: 'ZAR',
      metadata: {
        client_id: userId,
        client_name: userName ?? 'there',
        cartItems: cartItems.map((item) => ({
          booking_id: item.id,
          coach_id: item.coach_profiles?.id ?? '',
          coach_name: item.coach_profiles?.profiles?.full_name ?? 'your coach',
          sport: item.coach_profiles?.sport ?? null,
          session_date: formatDate(item.date),
          session_time: `${formatTime(item.start_time)} – ${formatTime(item.end_time)}`,
          amount: sessionAmount(item),
        })),
      },
      onSuccess: async (transaction: { reference: string }) => {
        const res = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: transaction.reference,
            bookingIds: cartItems.map((item) => item.id),
          }),
        })

        if (res.ok) {
          setToast(`${cartItems.length} session${cartItems.length !== 1 ? 's' : ''} paid successfully!`)
          setTimeout(() => {
            router.push('/dashboard/client')
          }, 1500) // brief delay so the toast is visible before redirecting
        }
      },
      onCancel: () => {
        console.log('Payment cancelled')
      },
    })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      {toast && (
        <div
          role="status"
          className="fixed right-6 top-6 z-50 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800 shadow-lg ring-1 ring-blue-200"
        >
          <Check className="h-4 w-4" />
          {toast}
        </div>
      )}

      <Link
        href="/dashboard/client"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Order Summary</h1>
        <p className="mt-2 text-sm text-gray-500">
          Review your confirmed sessions before payment.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : cartCount === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <ShoppingBag className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-base font-semibold text-gray-800">Your cart is empty.</p>
          <p className="mt-1 text-sm text-gray-500">
            You have no confirmed sessions awaiting payment.
          </p>
          <Link
            href="/coaches"
            className="mt-6 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Find a coach
          </Link>
        </div>
      ) : (
        <>
          {/* Breakdown card */}
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-700">Session breakdown</h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {cartItems.map((item) => {
                const coach = item.coach_profiles
                const profile = coach?.profiles
                const rate = coach?.hourly_rate ?? 0
                return (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {profile?.full_name ?? 'Coach'}
                      </p>
                      {coach?.sport && (
                        <span className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                          {coach.sport}
                        </span>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-500 sm:text-sm">
                      <p>{formatDate(item.date)}</p>
                      <p>{formatTime(item.start_time)}–{formatTime(item.end_time)}</p>
                    </div>
                    <div className="ml-4 min-w-[70px] text-right text-sm font-bold text-gray-900">
                      R{rate}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Totals card */}
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <dt>Sessions</dt>
                <dd>{cartCount}</dd>
              </div>
              <div className="flex justify-between text-gray-600">
                <dt>Subtotal</dt>
                <dd>R{cartTotal}</dd>
              </div>
              <div className="flex justify-between text-gray-600">
                <dt>Platform fee</dt>
                <dd>R0.00</dd>
              </div>
              <div className="my-2 border-t border-gray-100" />
              <div className="flex justify-between text-base font-bold text-gray-900">
                <dt>Total</dt>
                <dd>R{cartTotal}</dd>
              </div>
            </dl>
          </div>

          <button
            type="button"
            onClick={handlePay}
            className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Pay Now
          </button>

          <p className="mt-3 text-center text-xs text-gray-400">
            Secure payment via <span className="font-semibold text-gray-500">Paystack</span>
          </p>

          <div className="mt-8 flex items-start gap-2 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <p>
              Your booking is confirmed regardless of payment status.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
