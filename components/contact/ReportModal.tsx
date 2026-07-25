'use client'

import { X } from 'lucide-react'
import ReportForm from '@/components/contact/ReportForm'

export default function ReportModal({
    open,
    onClose,
}: {
    open: boolean
    onClose: () => void
}) {
    if (!open) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                        <h2 className="text-base font-bold text-gray-900">Report a Problem</h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                    <ReportForm onSuccess={onClose} />
                </div>
            </div>
        </>
    )
}