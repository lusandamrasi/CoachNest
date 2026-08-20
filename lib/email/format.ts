// Shared date/time formatting for email bodies — mirrors the
// weekday/month/day + 12h-time formatting used throughout the app's
// booking pages (see e.g. app/clients/[id]/page.tsx).

export function formatBookingDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-ZA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Africa/Johannesburg',
  })
}

export function formatBookingTime(time: string): string {
  const [h, m] = time.split(':')
  const h12 = parseInt(h) % 12 || 12
  return `${h12}:${m} ${parseInt(h) < 12 ? 'AM' : 'PM'}`
}
