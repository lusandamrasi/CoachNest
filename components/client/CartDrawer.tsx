'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, ShoppingCart, Calendar } from 'lucide-react'
import { useCart, type CartItem } from '@/lib/hooks/useCart'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

function getInitials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(time: string) {
  return time.slice(0, 5)
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const router = useRouter()
  const { cartItems, cartTotal, isLoading } = useCart()
  const [deferred, setDeferred] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [open])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const visible: CartItem[] = useMemo(
    () => cartItems.filter((item) => !deferred.has(item.id)),
    [cartItems, deferred]
  )

  const visibleTotal = useMemo(
    () => visible.reduce((sum, i) => sum + (i.coach_profiles?.hourly_rate ?? 0), 0),
    [visible]
  )

  const visibleCount = visible.length

  function handleCheckout() {
    onClose()
    router.push('/dashboard/client/checkout')
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Your cart"
      >
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">Your Cart</h2>
            {visibleCount > 0 && (
              <span className="inline-flex min-w-[24px] items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                {visibleCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : visibleCount === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <ShoppingCart className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-base font-semibold text-gray-800">
                Your cart is empty
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Confirmed sessions awaiting payment will appear here once a coach accepts your request.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  router.push('/coaches')
                }}
                className="mt-6 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Find Coaches
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {visible.map((item) => {
                const coach = item.coach_profiles
                const profile = coach?.profiles
                const name = profile?.full_name ?? 'Coach'
                const rate = coach?.hourly_rate

                return (
                  <li key={item.id} className="flex items-start gap-3 px-6 py-4">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-blue-50 border border-blue-100">
                      {profile?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.avatar_url}
                          alt={name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-blue-600">
                          {getInitials(name)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
                        <button
                          type="button"
                          onClick={() =>
                            setDeferred((prev) => {
                              const next = new Set(prev)
                              next.add(item.id)
                              return next
                            })
                          }
                          aria-label="Remove from cart"
                          className="text-gray-300 transition-colors hover:text-gray-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {coach?.sport && (
                        <span className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                          {coach.sport}
                        </span>
                      )}

                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        {formatDate(item.date)} · {formatTime(item.start_time)}–{formatTime(item.end_time)}
                      </div>

                      <div className="mt-1.5 text-sm font-semibold text-gray-800">
                        {rate != null ? `R${rate}` : 'Rate on request'}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {visibleCount > 0 && (
          <footer className="border-t border-gray-100 bg-white px-6 py-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Subtotal ({visibleCount} session{visibleCount !== 1 ? 's' : ''})
              </span>
              <span className="text-lg font-bold text-gray-900">R{visibleTotal}</span>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Checkout →
            </button>
            {cartTotal !== visibleTotal && (
              <p className="mt-2 text-center text-xs text-gray-400">
                Removed items reappear on refresh.
              </p>
            )}
          </footer>
        )}
      </aside>
    </>
  )
}
