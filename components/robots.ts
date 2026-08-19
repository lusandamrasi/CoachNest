import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/dashboard/', '/auth/', '/api/', '/checkout/'],
        },
        sitemap: 'https://coachnest.co.za/sitemap.xml',
    }
}