// Standalone smoke test for the Resend email templates.
// Run with: npx tsx scripts/test-email.ts
//
// Unlike Next.js, a plain `tsx` run doesn't auto-load .env.local, so we
// read it manually before importing anything that constructs a Resend
// client (that client is lazily built on first use, so this ordering
// only matters for correctness/clarity, not to avoid a crash).
import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2]
      }
    })
}

async function main() {
  const { sendBookingConfirmationToClient, sendBookingNotificationToCoach } = await import(
    '../lib/email/templates'
  )

  const testEmail = 'Coachnestt@gmail.com'

  console.log(`Sending test client confirmation email to ${testEmail}...`)
  const clientResult = await sendBookingConfirmationToClient({
    to: testEmail,
    clientName: 'Test Client',
    coachName: 'Test Coach',
    sport: 'Tennis',
    sessionDate: 'Thu, 20 Aug 2026',
    sessionTime: '09:00 – 10:00',
    amount: 350,
  })
  console.log('Client email result:', JSON.stringify(clientResult))

  console.log(`Sending test coach notification email to ${testEmail}...`)
  const coachResult = await sendBookingNotificationToCoach({
    to: testEmail,
    coachName: 'Test Coach',
    clientName: 'Test Client',
    sessionDate: 'Thu, 20 Aug 2026',
    sessionTime: '09:00 – 10:00',
    amount: 350,
  })
  console.log('Coach email result:', JSON.stringify(coachResult))
}

main().catch((err) => {
  console.error('Test script failed:', err)
  process.exit(1)
})
