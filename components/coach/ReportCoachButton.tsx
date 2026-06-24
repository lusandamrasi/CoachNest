'use client'

import { useState } from 'react'
import ReportModal from '@/components/shared/ReportModal'

interface ReportCoachButtonProps {
  coachId: string
}

export default function ReportCoachButton({ coachId }: ReportCoachButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline"
      >
        Report this coach
      </button>
      <ReportModal
        isOpen={open}
        onClose={() => setOpen(false)}
        reportedId={coachId}
        reportedType="coach"
      />
    </>
  )
}
