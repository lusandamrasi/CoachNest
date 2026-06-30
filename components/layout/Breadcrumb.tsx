import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface BreadcrumbProps {
  dashboardHref: string
  current: string
}

export default function Breadcrumb({ dashboardHref, current }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm">
      <Link
        href={dashboardHref}
        className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
      >
        <ChevronLeft className="h-4 w-4" />
        Dashboard
      </Link>
      <span className="text-gray-300">/</span>
      <span className="text-gray-600">{current}</span>
    </nav>
  )
}
