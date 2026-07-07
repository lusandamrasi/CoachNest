import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboardClient from '@/components/admin/AdminDashboardClient'

export const metadata = { title: 'Admin Dashboard — CoachNest' }

export default async function AdminDashboardPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') redirect('/dashboard/client')

    const [{ data: users }, { data: reports }] = await Promise.all([
        supabase
            .from('profiles')
            .select('id, full_name, avatar_url, role, created_at')
            .order('created_at', { ascending: false }),
        supabase
            .from('reports')
            .select(`
        id, reason, details, status, created_at, reported_type,
        reporter:reporter_id ( id, full_name, avatar_url ),
        reported:reported_id ( id, full_name, avatar_url )
      `)
            .order('created_at', { ascending: false }),
    ])

    return <AdminDashboardClient users={users ?? []} reports={reports ?? []} />
}