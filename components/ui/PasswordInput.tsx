'use client'

import { InputHTMLAttributes, forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const [visible, setVisible] = useState(false)

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={visible ? 'text' : 'password'}
            className={`
              w-full rounded-lg border px-4 py-2.5 pr-11 text-sm text-gray-900
              placeholder:text-gray-400 outline-none transition-colors
              focus:border-blue-600 focus:ring-2 focus:ring-blue-100
              ${error ? 'border-red-400' : 'border-gray-300'}
              ${className}
            `}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            tabIndex={-1}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-700"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  },
)
PasswordInput.displayName = 'PasswordInput'

export default PasswordInput
