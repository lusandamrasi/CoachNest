import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg'
}

const paddingClasses = { sm: 'p-4', md: 'p-6', lg: 'p-8' }

export default function Card({ padding = 'md', className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
