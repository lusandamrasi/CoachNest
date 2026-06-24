'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface ReviewFormProps {
  coachId: string
  clientId: string
}

export default function ReviewForm({ coachId, clientId }: ReviewFormProps) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (rating < 1) {
      setError('Please choose a star rating.')
      return
    }
    setSubmitting(true)
    const supabase = createClient()
    const { error: insertErr } = await supabase.from('reviews').insert({
      coach_id: coachId,
      client_id: clientId,
      rating,
      review_text: text.trim() || null,
    })
    setSubmitting(false)

    if (insertErr) {
      setError(`Could not post review: ${insertErr.message}`)
      return
    }

    setRating(0)
    setText('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <p className="text-sm font-medium text-gray-700">Your rating</p>
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = (hover || rating) >= n
            return (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
                className="rounded p-1 text-amber-500 hover:scale-110 transition-transform"
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star className={`h-6 w-6 ${filled ? 'fill-current' : 'text-gray-300'}`} />
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label htmlFor="review_text" className="text-sm font-medium text-gray-700">
          Your review
        </label>
        <textarea
          id="review_text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Share your experience working with this coach."
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <Button type="submit" size="sm" loading={submitting}>
        Submit Review
      </Button>
    </form>
  )
}
