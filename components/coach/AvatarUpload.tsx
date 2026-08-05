'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Camera } from 'lucide-react'
import Button from '@/components/ui/Button'
import AvatarCropModal from '@/components/ui/AvatarCropModal'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 2 * 1024 * 1024 // 2 MB

interface AvatarUploadProps {
  fullName: string | null
  currentUrl: string | null
  onFileSelected: (file: File | null) => void
}

export default function AvatarUpload({ fullName, currentUrl, onFileSelected }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const initial = (fullName?.trim()?.[0] ?? '?').toUpperCase()
  const shown = preview ?? currentUrl

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const file = e.target.files?.[0] ?? null
    if (!file) {
      onFileSelected(null)
      return
    }

    if (!ACCEPTED.includes(file.type)) {
      setError('Please choose a JPG, PNG, or WebP image.')
      onFileSelected(null)
      e.target.value = ''
      return
    }
    if (file.size > MAX_BYTES) {
      setError('Image must be 2MB or smaller.')
      onFileSelected(null)
      e.target.value = ''
      return
    }

    setCropSrc(URL.createObjectURL(file))
    e.target.value = ''
  }

  function handleCropped(blob: Blob) {
    if (preview) URL.revokeObjectURL(preview)
    const croppedFile = new File([blob], 'avatar.jpg', { type: blob.type })
    const url = URL.createObjectURL(croppedFile)
    setPreview(url)
    onFileSelected(croppedFile)
  }

  function handleCropClose() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  return (
    <div className="flex items-center gap-5">
      <div className="h-20 w-20 overflow-hidden rounded-full border border-gray-200 bg-blue-600">
        {shown ? (
          <Image
            src={shown}
            alt="Profile picture"
            width={80}
            height={80}
            className="h-20 w-20 object-cover"
            unoptimized
          />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center text-2xl font-semibold text-white">
            {initial}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          className="gap-1.5"
        >
          <Camera className="h-4 w-4" />
          Upload Photo
        </Button>
        <p className="text-xs text-gray-500">JPG, PNG, or WebP. Max 2MB.</p>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        onChange={handleFile}
        className="hidden"
      />

      <AvatarCropModal
        imageSrc={cropSrc}
        isOpen={!!cropSrc}
        onClose={handleCropClose}
        onCropped={handleCropped}
      />
    </div>
  )
}
