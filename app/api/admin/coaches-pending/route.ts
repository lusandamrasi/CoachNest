import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/isAdmin'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const isAdmin = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('coach_profiles')
    .select(`
      id, sport, verification_status, id_document_url, qualifications_url, created_at, email,
      profiles!coach_profiles_id_fkey ( full_name, avatar_url )
    `)
    .not('id_document_url', 'is', null)
    .in('verification_status', ['pending', 'id_verified', 'qualification_verified'])
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const coaches = (data ?? []).map((row) => {
    const profile = row.profiles as unknown as { full_name: string | null; avatar_url: string | null } | null
    return {
      id: row.id,
      full_name: profile?.full_name ?? null,
      email: row.email,
      sport: row.sport,
      verification_status: row.verification_status,
      id_document_url: row.id_document_url,
      qualifications_url: row.qualifications_url,
      created_at: row.created_at,
      avatar_url: profile?.avatar_url ?? null,
    }
  })

  return NextResponse.json(coaches)
}
