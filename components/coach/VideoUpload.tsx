'use client'

import { useRef, useState } from 'react'
import { Film, UploadCloud, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

const ACCEPTED = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_BYTES = 50 * 1024 * 1024 // 50 MB

interface VideoUploadProps {
  userId: string
  initialVideoUrl: string | null
  onVideoSaved: (publicUrl: string) => void
  onError: (message: string) => void
}

export default function VideoUpload({ userId, initialVideoUrl, onVideoSaved, onError }: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(initialVideoUrl)
  const [progress, setProgress] = useState<number | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  function pickFile() {
    inputRef.current?.click()
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setLocalError(null)
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!ACCEPTED.includes(file.type)) {
      setLocalError('Please choose an MP4, WebM, or MOV file.')
      return
    }
    if (file.size > MAX_BYTES) {
      setLocalError('Video must be 50MB or smaller.')
      return
    }

    await uploadAndSave(file)
  }

  async function uploadAndSave(file: File) {
    const supabase = createClient()
    const path = `${userId}/intro.mp4`

    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
    if (sessionErr || !sessionData.session) {
      onError('Your session expired. Please sign in again.')
      return
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const endpoint = `${supabaseUrl}/storage/v1/object/coach-media/${path}`
    const accessToken = sessionData.session.access_token

    setProgress(0)

    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', endpoint, true)
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
      xhr.setRequestHeader('x-upsert', 'true')
      xhr.setRequestHeader('Content-Type', file.type)

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          setProgress(Math.round((ev.loaded / ev.total) * 100))
        }
      }
      xhr.onload = async () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          setProgress(null)
          onError(`Upload failed (${xhr.status}). ${xhr.responseText || ''}`.trim())
          resolve()
          return
        }

        const { data: pub } = supabase.storage.from('coach-media').getPublicUrl(path)
        const cacheBusted = `${pub.publicUrl}?v=${Date.now()}`

        const { error: dbErr } = await supabase
          .from('coach_profiles')
          .update({ intro_video_url: cacheBusted })
          .eq('id', userId)

        if (dbErr) {
          setProgress(null)
          onError(`Saved file but DB update failed: ${dbErr.message}`)
          resolve()
          return
        }

        setVideoUrl(cacheBusted)
        setProgress(null)
        onVideoSaved(cacheBusted)
        resolve()
      }
      xhr.onerror = () => {
        setProgress(null)
        onError('Network error during upload.')
        resolve()
      }
      xhr.send(file)
    })
  }

  const uploading = progress !== null

  return (
    <div className="flex flex-col gap-3">
      {videoUrl ? (
        <div className="flex flex-col gap-3">
          <video
            key={videoUrl}
            src={videoUrl}
            controls
            className="aspect-video w-full max-w-xl rounded-xl border border-gray-200 bg-black"
          />
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={pickFile}
              disabled={uploading}
              className="gap-1.5"
            >
              <RotateCcw className="h-4 w-4" />
              Replace Video
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={pickFile}
          disabled={uploading}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center transition-colors hover:border-blue-500 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <UploadCloud className="h-6 w-6" />
          </span>
          <span className="font-medium text-gray-900">Upload your 1-minute intro video</span>
          <span className="text-xs text-gray-500">MP4, WebM, or MOV. Max 50MB.</span>
        </button>
      )}

      {uploading && (
        <div className="flex items-center gap-3">
          <Film className="h-4 w-4 text-blue-600" />
          <div className="flex-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${progress ?? 0}%` }}
              />
            </div>
          </div>
          <span className="w-10 text-right text-xs font-medium text-gray-600">{progress}%</span>
        </div>
      )}

      {localError && <p className="text-xs text-red-500">{localError}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        onChange={handleFile}
        className="hidden"
      />
    </div>
  )
}
