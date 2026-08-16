'use client'

import { useState } from 'react'
import { Copy, Check, Link2 } from 'lucide-react'

export default function ShareProfileLink({ coachId }: { coachId: string }) {
    const [copied, setCopied] = useState(false)

    const profileUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/coaches/${coachId}`

    const handleCopy = async () => {
        await navigator.clipboard.writeText(profileUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Link2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-800">Your Profile Link</p>
                    <p className="text-xs text-gray-400">Share this link so clients can find and book you.</p>
                </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="flex-1 text-xs text-gray-500 truncate font-mono">{profileUrl}</p>
                <button
                    onClick={handleCopy}
                    className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${copied
                            ? 'bg-green-50 text-green-600 border border-green-100'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    {copied ? (
                        <>
                            <Check className="w-3.5 h-3.5" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}