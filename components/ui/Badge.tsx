import { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'blue' | 'green' | 'gray'
}

const variantClasses = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  gray: 'bg-gray-100 text-gray-600',
}

export default function Badge({ variant = 'blue', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
