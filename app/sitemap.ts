import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createClient()

    const { data: coaches } = await supabase
        .from('coach_profiles')
        .select('id, created_at')
        .eq('is_published', true)

    const coachUrls = (coaches ?? []).map((c) => ({
        url: `https://coachnest.co.za/coaches/${c.id}`,
        lastModified: c.created_at,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    return [
        {
            url: 'https://coachnest.co.za',
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: 'https://coachnest.co.za/coaches',
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: 'https://coachnest.co.za/contact',
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        ...coachUrls,
    ]
}