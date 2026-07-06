'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/hooks/useCart'
import CartDrawer from '@/components/client/CartDrawer'

export default function CartButton() {
  const [open, setOpen] = useState(false)
  const { cartCount } = useCart()

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open cart (${cartCount} item${cartCount !== 1 ? 's' : ''})`}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600"
      >
        <ShoppingCart className="h-5 w-5" />
        {cartCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white ring-2 ring-white">
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}
      </button>

      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}
