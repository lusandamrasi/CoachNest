'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, X, Check } from 'lucide-react'

const SA_LANGUAGES = [
  'Zulu',
  'Xhosa',
  'Afrikaans',
  'English',
  'Northern Sotho',
  'Tswana',
  'Sotho',
  'Tsonga',
  'Swati',
  'Venda',
  'Ndebele',
] as const

const WORLD_LANGUAGES = [
  'Mandarin',
  'Spanish',
  'French',
  'Portuguese',
  'Arabic',
  'Hindi',
  'Bengali',
  'Russian',
  'Japanese',
  'German',
  'Korean',
  'Italian',
  'Dutch',
  'Polish',
  'Turkish',
  'Vietnamese',
  'Thai',
  'Malay',
  'Swahili',
  'Hausa',
  'Amharic',
  'Yoruba',
  'Igbo',
  'Other',
] as const

interface LanguagesSelectProps {
  value: string[]
  onChange: (next: string[]) => void
}

export default function LanguagesSelect({ value, onChange }: LanguagesSelectProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleDown(e: MouseEvent) {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleDown)
    return () => document.removeEventListener('mousedown', handleDown)
  }, [open])

  function toggle(lang: string) {
    if (value.includes(lang)) {
      onChange(value.filter((v) => v !== lang))
    } else {
      onChange([...value, lang])
    }
  }

  function remove(lang: string) {
    onChange(value.filter((v) => v !== lang))
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-left text-sm text-gray-700 outline-none transition-colors hover:border-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={value.length === 0 ? 'text-gray-400' : 'text-gray-700'}>
          {value.length === 0
            ? 'Select languages…'
            : `${value.length} language${value.length === 1 ? '' : 's'} selected`}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-2 shadow-lg"
        >
          <p className="px-3 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            South African languages
          </p>
          {SA_LANGUAGES.map((lang) => {
            const selected = value.includes(lang)
            return (
              <label
                key={lang}
                className="flex cursor-pointer items-center justify-between px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggle(lang)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {lang}
                </span>
                {selected && <Check className="h-4 w-4 text-blue-600" />}
              </label>
            )
          })}

          <p className="mt-2 border-t border-gray-100 px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Other world languages
          </p>
          {WORLD_LANGUAGES.map((lang) => {
            const selected = value.includes(lang)
            return (
              <label
                key={lang}
                className="flex cursor-pointer items-center justify-between px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggle(lang)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {lang}
                </span>
                {selected && <Check className="h-4 w-4 text-blue-600" />}
              </label>
            )
          })}
        </div>
      )}

      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((lang) => (
            <span
              key={lang}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
            >
              {lang}
              <button
                type="button"
                onClick={() => remove(lang)}
                className="rounded-full p-0.5 text-blue-600 hover:bg-blue-100"
                aria-label={`Remove ${lang}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
