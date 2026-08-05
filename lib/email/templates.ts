import { Resend } from 'resend'

const FROM = 'CoachNest Bookings <bookings@coachnest.co.za>'
const BRAND_BLUE = '#2563EB'

// Lazily constructed so this module can be imported (e.g. by a standalone
// script) before RESEND_API_KEY is guaranteed to be on process.env yet.
let resendClient: Resend | null = null
function getResendClient(): Resend {
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY)
  return resendClient
}

interface BookingConfirmationParams {
  to: string
  clientName: string
  coachName: string
  sport: string
  sessionDate: string
  sessionTime: string
  amount: number
}

interface BookingNotificationParams {
  to: string
  coachName: string
  clientName: string
  sessionDate: string
  sessionTime: string
  amount: number
}

function emailShell(bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1f2937;">
      <p style="font-size: 20px; font-weight: 700; color: ${BRAND_BLUE}; margin: 0 0 24px;">
        Coach<span style="color: #1f2937;">Nest</span>
      </p>
      ${bodyHtml}
      <p style="margin-top: 32px; font-size: 12px; color: #9ca3af;">CoachNest — Find Your Perfect Coach</p>
    </div>
  `
}

function detailsTable(rows: [string, string][]): string {
  return `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
      ${rows
        .map(
          ([label, value]) => `
        <tr>
          <td style="padding: 8px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.03em; width: 90px; vertical-align: top;">${label}</td>
          <td style="padding: 8px 0; font-size: 14px; color: #1f2937; font-weight: 600;">${value}</td>
        </tr>
      `,
        )
        .join('')}
    </table>
  `
}

export async function sendBookingConfirmationToClient(params: BookingConfirmationParams) {
  const { to, clientName, coachName, sport, sessionDate, sessionTime, amount } = params

  try {
    const html = emailShell(`
      <p style="font-size: 17px; font-weight: 700; margin: 0 0 16px;">✅ Your booking is confirmed!</p>
      <p style="font-size: 14px; margin: 0 0 4px;">Hi ${clientName},</p>
      <p style="font-size: 14px; margin: 0 0 4px; color: #4b5563;">Your session has been booked and payment received.</p>
      ${detailsTable([
        ['Coach', coachName],
        ['Sport', sport],
        ['Date', sessionDate],
        ['Time', sessionTime],
        ['Amount', `R${amount}`],
      ])}
      <p style="font-size: 14px; color: #4b5563; margin: 0 0 16px;">Your coach will be in touch to confirm any final details.</p>
      <p style="font-size: 14px; margin: 0;">
        <a href="https://coachnest.co.za/dashboard/client" style="color: ${BRAND_BLUE}; font-weight: 600;">
          View your bookings at coachnest.co.za/dashboard/client
        </a>
      </p>
    `)

    return await getResendClient().emails.send({
      from: FROM,
      to,
      subject: `Booking Confirmed — ${sport} with ${coachName}`,
      html,
    })
  } catch (err) {
    console.error('Failed to send client booking confirmation email:', err)
    return null
  }
}

export async function sendBookingNotificationToCoach(params: BookingNotificationParams) {
  const { to, coachName, clientName, sessionDate, sessionTime, amount } = params

  try {
    const html = emailShell(`
      <p style="font-size: 17px; font-weight: 700; margin: 0 0 16px;">💰 You have a new paid booking!</p>
      <p style="font-size: 14px; margin: 0 0 4px;">Hi ${coachName},</p>
      <p style="font-size: 14px; margin: 0 0 4px; color: #4b5563;">A client has paid for a session with you.</p>
      ${detailsTable([
        ['Client', clientName],
        ['Date', sessionDate],
        ['Time', sessionTime],
        ['Amount', `R${amount}`],
      ])}
      <p style="font-size: 14px; margin: 0;">
        <a href="https://coachnest.co.za/dashboard/coach" style="color: ${BRAND_BLUE}; font-weight: 600;">
          View your bookings at coachnest.co.za/dashboard/coach
        </a>
      </p>
    `)

    return await getResendClient().emails.send({
      from: FROM,
      to,
      subject: `New Paid Booking — ${clientName} on ${sessionDate}`,
      html,
    })
  } catch (err) {
    console.error('Failed to send coach booking notification email:', err)
    return null
  }
}
