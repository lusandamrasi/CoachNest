import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/isAdmin'
import { createServiceClient } from '@/lib/supabase/service'

const ALLOWED_BUCKETS = ['coach-documents']

export async function POST(req: NextRequest) {
  const isAdmin = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { filePath, bucket } = await req.json()

  if (!filePath || !bucket) {
    return NextResponse.json({ error: 'Missing filePath or bucket' }, { status: 400 })
  }
  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(filePath, 60)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ signedUrl: data.signedUrl })
}
