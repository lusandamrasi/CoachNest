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
  const {
    sendBookingConfirmationToClient,
    sendBookingNotificationToCoach,
    sendWelcomeEmail,
    sendNewBookingRequestToCoach,
    sendBookingAcceptedToClient,
    sendBookingCancelledEmail,
    sendPostSessionReviewEmail,
  } = await import('../lib/email/templates')

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

  console.log(`Sending test welcome email (client) to ${testEmail}...`)
  const welcomeClientResult = await sendWelcomeEmail({
    to: testEmail,
    name: 'Test Client',
    role: 'client',
  })
  console.log('Welcome (client) email result:', JSON.stringify(welcomeClientResult))

  console.log(`Sending test welcome email (coach) to ${testEmail}...`)
  const welcomeCoachResult = await sendWelcomeEmail({
    to: testEmail,
    name: 'Test Coach',
    role: 'coach',
  })
  console.log('Welcome (coach) email result:', JSON.stringify(welcomeCoachResult))

  console.log(`Sending test new booking request email to ${testEmail}...`)
  const bookingRequestResult = await sendNewBookingRequestToCoach({
    to: testEmail,
    coachName: 'Test Coach',
    clientName: 'Test Client',
    sport: 'Tennis',
    date: 'Thu, 20 Aug 2026',
    startTime: '9:00 AM',
    endTime: '10:00 AM',
    location: 'Sandton, Johannesburg',
    cost: 350,
    clientMessage: 'Looking forward to it!',
    bookingId: 'test-booking-id-1',
  })
  console.log('New booking request email result:', JSON.stringify(bookingRequestResult))

  console.log(`Sending test booking accepted email to ${testEmail}...`)
  const bookingAcceptedResult = await sendBookingAcceptedToClient({
    to: testEmail,
    clientName: 'Test Client',
    coachName: 'Test Coach',
    sport: 'Tennis',
    date: 'Thu, 20 Aug 2026',
    startTime: '9:00 AM',
    endTime: '10:00 AM',
    location: 'Sandton, Johannesburg',
    sessionFee: 350,
    bookingFee: 0,
    total: 350,
    bookingId: 'test-booking-id-1',
  })
  console.log('Booking accepted email result:', JSON.stringify(bookingAcceptedResult))

  console.log(`Sending test booking cancelled email to ${testEmail}...`)
  const bookingCancelledResult = await sendBookingCancelledEmail({
    to: testEmail,
    name: 'Test Client',
    otherPersonName: 'Test Coach',
    role: 'client',
    sport: 'Tennis',
    date: 'Thu, 20 Aug 2026',
    startTime: '9:00 AM',
    endTime: '10:00 AM',
    bookingId: 'test-booking-id-1',
    cancelledBy: 'coach',
    reason: 'Coach is unavailable',
    refundAmount: null,
  })
  console.log('Booking cancelled email result:', JSON.stringify(bookingCancelledResult))

  console.log(`Sending test post-session review email to ${testEmail}...`)
  const postSessionReviewResult = await sendPostSessionReviewEmail({
    to: testEmail,
    clientName: 'Test Client',
    coachName: 'Test Coach',
    coachId: 'test-coach-id-1',
  })
  console.log('Post-session review email result:', JSON.stringify(postSessionReviewResult))
}

main().catch((err) => {
  console.error('Test script failed:', err)
  process.exit(1)
})
