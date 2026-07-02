'use client'

import { useState } from 'react'
import emailjs from '@emailjs/browser'
import { CheckCircle2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const MAX_MESSAGE = 1000

type Errors = { name?: string; email?: string; message?: string }

function validate(name: string, email: string, message: string): Errors {
  const errors: Errors = {}
  if (!name.trim()) errors.name = 'Please enter your name'
  if (!email.trim()) errors.email = 'Please enter your email'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Enter a valid email address'
  if (!message.trim()) errors.message = 'Please enter a message'
  else if (message.length > MAX_MESSAGE) errors.message = `Message must be under ${MAX_MESSAGE} characters`
  return errors
}

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState('')

  function reset() {
    setName('')
    setEmail('')
    setMessage('')
    setErrors({})
    setServerError('')
    setSent(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setServerError('')

    const validation = validate(name, email, message)
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY

    if (!serviceId || !templateId || !publicKey) {
      setServerError('Failed to send. Please email us at Coachnestt@gmail.com')
      return
    }

    setLoading(true)
    try {
      await emailjs.send(
        serviceId,
        templateId,
        { from_name: name, reply_to: email, message },
        { publicKey }
      )
      setSent(true)
    } catch {
      setServerError('Failed to send. Please email us at Coachnestt@gmail.com')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" strokeWidth={1.5} />
        <h2 className="mt-4 text-xl font-bold text-gray-900">Message Sent!</h2>
        <p className="mt-2 text-sm text-gray-600">We&apos;ll get back to you as soon as possible!</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
    >
      <div className="flex flex-col gap-4">
        <Input
          id="contact-name"
          label="Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoComplete="name"
          required
        />

        <Input
          id="contact-email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
          required
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="contact-message" className="text-sm font-medium text-gray-700">
            Message
          </label>
          <textarea
            id="contact-message"
            rows={5}
            maxLength={MAX_MESSAGE}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            className={`w-full resize-none rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ${
              errors.message ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          <div className="flex items-center justify-between">
            {errors.message ? (
              <p className="text-xs text-red-500">{errors.message}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-gray-400">
              {message.length}/{MAX_MESSAGE}
            </p>
          </div>
        </div>

        {serverError && (
          <p className="text-sm text-red-500">{serverError}</p>
        )}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? 'Sending...' : 'Send Message'}
        </Button>
      </div>
    </form>
  )
}
