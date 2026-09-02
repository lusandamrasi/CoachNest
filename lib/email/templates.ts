import { Resend } from 'resend'

const FROM = 'CoachNest Bookings <bookings@coachnest.co.za>'
const BRAND_BLUE = '#2563EB'

// Used by all triggers added after the original booking-confirmation pair
// above — kept distinct from FROM so that pair's sender name is untouched.
const NEW_FROM = 'CoachNest <bookings@coachnest.co.za>'
const REPLY_TO = 'Coachnestt@gmail.com'

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

// --- Helpers shared by the triggers below (kept separate from the two
// functions above so their output is never touched) ---------------------

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function ctaButton(label: string, href: string): string {
  return `
    <p style="margin: 24px 0;">
      <a href="${href}" style="display: inline-block; background-color: ${BRAND_BLUE}; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px;">
        ${label}
      </a>
    </p>
  `
}

function sessionsTable(sessions: { sport: string; clientName: string; date: string; amount: number }[]): string {
  return `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
      <thead>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <th style="text-align: left; padding: 8px 4px; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em;">Session</th>
          <th style="text-align: left; padding: 8px 4px; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em;">Client</th>
          <th style="text-align: left; padding: 8px 4px; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em;">Date</th>
          <th style="text-align: right; padding: 8px 4px; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${sessions
          .map(
            (s) => `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 8px 4px; color: #1f2937;">${escapeHtml(s.sport)}</td>
          <td style="padding: 8px 4px; color: #1f2937;">${escapeHtml(s.clientName)}</td>
          <td style="padding: 8px 4px; color: #1f2937;">${escapeHtml(s.date)}</td>
          <td style="padding: 8px 4px; color: #1f2937; text-align: right; font-weight: 600;">R${s.amount}</td>
        </tr>`,
          )
          .join('')}
      </tbody>
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

// --- Email 1 — Welcome to CoachNest --------------------------------------

interface WelcomeEmailParams {
  to: string
  name: string
  role: 'client' | 'coach'
}

export async function sendWelcomeEmail(params: WelcomeEmailParams) {
  const { to, name, role } = params

  try {
    const safeName = escapeHtml(name)
    const body =
      role === 'coach'
        ? `
      <p style="font-size: 17px; font-weight: 700; margin: 0 0 16px;">Welcome to CoachNest!</p>
      <p style="font-size: 14px; margin: 0 0 4px;">Hi ${safeName},</p>
      <p style="font-size: 14px; color: #4b5563; margin: 0 0 16px;">
        Your coach profile has been created. Complete your profile to start attracting clients and grow your coaching business.
      </p>
      ${ctaButton('COMPLETE YOUR PROFILE', 'https://coachnest.co.za/dashboard/coach/edit-profile')}
      <p style="font-size: 14px; color: #4b5563; margin: 16px 0 0;">If you have any questions, our team is here to help.</p>
      <p style="font-size: 14px; margin: 16px 0 0;">Welcome to CoachNest!<br />The CoachNest Team</p>
    `
        : `
      <p style="font-size: 17px; font-weight: 700; margin: 0 0 16px;">Welcome to CoachNest!</p>
      <p style="font-size: 14px; margin: 0 0 4px;">Hi ${safeName},</p>
      <p style="font-size: 14px; color: #4b5563; margin: 0 0 16px;">
        You can now discover and book trusted coaches across a range of sports, all through one simple platform.
        Whether you're looking to improve your skills, prepare for competition, or simply enjoy your sport more,
        CoachNest makes it easy to find the right coach for you.
      </p>
      <p style="font-size: 14px; color: #4b5563; margin: 0 0 4px;">Ready to get started?</p>
      ${ctaButton('EXPLORE COACHES', 'https://coachnest.co.za/coaches')}
      <p style="font-size: 14px; color: #4b5563; margin: 16px 0 0;">If you have any questions, our team is here to help.</p>
      <p style="font-size: 14px; margin: 16px 0 0;">Welcome to CoachNest!<br />The CoachNest Team</p>
    `

    const html = emailShell(body)

    return await getResendClient().emails.send({
      from: NEW_FROM,
      to,
      replyTo: REPLY_TO,
      subject: `Welcome to CoachNest, ${name}!`,
      html,
    })
  } catch (err) {
    console.error('Failed to send welcome email:', err)
    return null
  }
}

// --- Email 2 — New Booking Request (Coach) -------------------------------

interface NewBookingRequestParams {
  to: string
  coachName: string
  clientName: string
  sport: string
  date: string
  startTime: string
  endTime: string
  location: string
  cost: number
  clientMessage?: string | null
  bookingId: string
}

export async function sendNewBookingRequestToCoach(params: NewBookingRequestParams) {
  const {
    to, coachName, clientName, sport, date, startTime, endTime,
    location, cost, clientMessage, bookingId,
  } = params

  try {
    const html = emailShell(`
      <p style="font-size: 17px; font-weight: 700; margin: 0 0 16px;">New booking request</p>
      <p style="font-size: 14px; margin: 0 0 4px;">Hi ${escapeHtml(coachName)},</p>
      <p style="font-size: 14px; color: #4b5563; margin: 0 0 16px;">You have received a new coaching request on CoachNest.</p>
      ${detailsTable([
        ['Client', escapeHtml(clientName)],
        ['Sport', escapeHtml(sport)],
        ['Date', escapeHtml(date)],
        ['Time', `${escapeHtml(startTime)} – ${escapeHtml(endTime)}`],
        ['Location', escapeHtml(location)],
        ['Your Price', `R${cost}`],
      ])}
      <p style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.03em; margin: 0 0 6px;">Client message</p>
      <p style="font-size: 14px; color: #4b5563; margin: 0 0 16px; font-style: italic;">${clientMessage ? escapeHtml(clientMessage) : 'No message provided'}</p>
      <p style="font-size: 14px; color: #4b5563; margin: 0 0 4px;">Please review the request and choose whether you would like to accept or decline the booking.</p>
      ${ctaButton('VIEW BOOKING', 'https://coachnest.co.za/dashboard/coach/manage-booking')}
      <p style="font-size: 14px; color: #4b5563; margin: 16px 0 0;">Please respond as soon as possible so the client knows whether their requested session can go ahead.</p>
      <p style="font-size: 14px; margin: 16px 0 0;">The CoachNest Team</p>
      <p style="font-size: 11px; color: #9ca3af; margin: 12px 0 0;">Booking reference: ${escapeHtml(bookingId)}</p>
    `)

    return await getResendClient().emails.send({
      from: NEW_FROM,
      to,
      replyTo: REPLY_TO,
      subject: `New Booking Request from ${clientName}`,
      html,
    })
  } catch (err) {
    console.error('Failed to send new booking request email:', err)
    return null
  }
}

// --- Email 3 — Booking Accepted / Payment Required (Client) -------------

interface BookingAcceptedParams {
  to: string
  clientName: string
  coachName: string
  sport: string
  date: string
  startTime: string
  endTime: string
  location: string
  sessionFee: number
  bookingFee: number
  total: number
  bookingId: string
}

export async function sendBookingAcceptedToClient(params: BookingAcceptedParams) {
  const {
    to, clientName, coachName, sport, date, startTime, endTime,
    location, sessionFee, bookingFee, total, bookingId,
  } = params

  try {
    const html = emailShell(`
      <p style="font-size: 17px; font-weight: 700; margin: 0 0 16px;">Your booking has been accepted</p>
      <p style="font-size: 14px; margin: 0 0 4px;">Hi ${escapeHtml(clientName)},</p>
      <p style="font-size: 14px; color: #4b5563; margin: 0 0 16px;">
        Good news! ${escapeHtml(coachName)} has accepted your coaching request. Your session is now awaiting payment.
      </p>
      ${detailsTable([
        ['Coach', escapeHtml(coachName)],
        ['Sport', escapeHtml(sport)],
        ['Date', escapeHtml(date)],
        ['Time', `${escapeHtml(startTime)} – ${escapeHtml(endTime)}`],
        ['Location', escapeHtml(location)],
        ['Session Fee', `R${sessionFee}`],
        ['CoachNest Booking Fee', `R${bookingFee}`],
        ['Total', `R${total}`],
      ])}
      <p style="font-size: 14px; color: #4b5563; margin: 0 0 4px;">Complete your payment to confirm your booking.</p>
      ${ctaButton('PAY NOW', 'https://coachnest.co.za/dashboard/client')}
      <p style="font-size: 14px; color: #4b5563; margin: 16px 0 0;">Your booking will only be confirmed once payment has been successfully completed.</p>
      <p style="font-size: 14px; margin: 16px 0 0;">The CoachNest Team</p>
      <p style="font-size: 11px; color: #9ca3af; margin: 12px 0 0;">Booking reference: ${escapeHtml(bookingId)}</p>
    `)

    return await getResendClient().emails.send({
      from: NEW_FROM,
      to,
      replyTo: REPLY_TO,
      subject: `Your booking with ${coachName} has been accepted — payment required`,
      html,
    })
  } catch (err) {
    console.error('Failed to send booking accepted email:', err)
    return null
  }
}

// --- Email 6 — Booking Cancelled (Client or Coach) -----------------------

interface BookingCancelledParams {
  to: string
  name: string
  otherPersonName: string
  role: 'client' | 'coach'
  sport: string
  date: string
  startTime: string
  endTime: string
  bookingId: string
  cancelledBy: 'client' | 'coach'
  reason?: string | null
  refundAmount?: number | null
}

export async function sendBookingCancelledEmail(params: BookingCancelledParams) {
  const {
    to, name, otherPersonName, role, sport, date, startTime, endTime,
    bookingId, cancelledBy, reason, refundAmount,
  } = params

  try {
    const html = emailShell(`
      <p style="font-size: 17px; font-weight: 700; margin: 0 0 16px;">Your CoachNest booking has been cancelled</p>
      <p style="font-size: 14px; margin: 0 0 4px;">Hi ${escapeHtml(name)},</p>
      <p style="font-size: 14px; color: #4b5563; margin: 0 0 16px;">Your CoachNest booking has been cancelled.</p>
      ${detailsTable([
        [role === 'client' ? 'Coach' : 'Client', escapeHtml(otherPersonName)],
        ['Sport', escapeHtml(sport)],
        ['Date', escapeHtml(date)],
        ['Time', `${escapeHtml(startTime)} – ${escapeHtml(endTime)}`],
        ['Reference', escapeHtml(bookingId)],
      ])}
      <p style="font-size: 14px; color: #4b5563; margin: 0 0 16px;">
        Cancelled by: ${cancelledBy === 'client' ? 'Client' : 'Coach'}${reason ? ` — ${escapeHtml(reason)}` : ' — No reason provided'}
      </p>
      ${refundAmount ? `<p style="font-size: 14px; color: #4b5563; margin: 0 0 16px;">Your refund of R${refundAmount} will be processed according to the CoachNest refund policy.</p>` : ''}
      <p style="font-size: 14px; color: #4b5563; margin: 0 0 4px;">If you would like to arrange another session, browse available coaches.</p>
      ${ctaButton('FIND A COACH', 'https://coachnest.co.za/coaches')}
      <p style="font-size: 14px; color: #4b5563; margin: 16px 0 0;">
        If you believe this cancellation was made in error, please contact our support team at
        <a href="mailto:Coachnestt@gmail.com" style="color: ${BRAND_BLUE};">Coachnestt@gmail.com</a>
      </p>
      <p style="font-size: 14px; margin: 16px 0 0;">The CoachNest Team</p>
    `)

    return await getResendClient().emails.send({
      from: NEW_FROM,
      to,
      replyTo: REPLY_TO,
      subject: 'Your CoachNest booking has been cancelled',
      html,
    })
  } catch (err) {
    console.error('Failed to send booking cancelled email:', err)
    return null
  }
}

// --- Email 7 — How Was Your Session? (Client) -----------------------------

interface PostSessionReviewParams {
  to: string
  clientName: string
  coachName: string
  coachId: string
}

export async function sendPostSessionReviewEmail(params: PostSessionReviewParams) {
  const { to, clientName, coachName, coachId } = params

  try {
    const html = emailShell(`
      <p style="font-size: 17px; font-weight: 700; margin: 0 0 16px;">How was your session with ${escapeHtml(coachName)}?</p>
      <p style="font-size: 14px; margin: 0 0 4px;">Hi ${escapeHtml(clientName)},</p>
      <p style="font-size: 14px; color: #4b5563; margin: 0 0 16px;">
        We hope you enjoyed your recent coaching session with ${escapeHtml(coachName)}.
      </p>
      <p style="font-size: 14px; color: #4b5563; margin: 0 0 16px;">
        Your feedback helps coaches improve and helps other athletes find the right coach.
      </p>
      <p style="font-size: 14px; color: #4b5563; margin: 0 0 4px;">How would you rate your session?</p>
      ${ctaButton('LEAVE A REVIEW', `https://coachnest.co.za/coaches/${coachId}`)}
      <p style="font-size: 14px; color: #4b5563; margin: 16px 0 0;">Your review only takes a minute and can make a big difference to the CoachNest community.</p>
      <p style="font-size: 14px; margin: 16px 0 0;">Thanks for using CoachNest!<br />The CoachNest Team</p>
    `)

    return await getResendClient().emails.send({
      from: NEW_FROM,
      to,
      replyTo: REPLY_TO,
      subject: `How was your session with ${coachName}?`,
      html,
    })
  } catch (err) {
    console.error('Failed to send post-session review email:', err)
    return null
  }
}

// --- Email 8 — Coach Weekly Payment Sent (Coach) --------------------------

interface CoachWeeklyPayoutParams {
  to: string
  coachName: string
  periodStart: string
  periodEnd: string
  sessions: { sport: string; clientName: string; date: string; amount: number }[]
  totalSessions: number
  totalCoachingFees: number
  totalPayout: number
}

export async function sendCoachWeeklyPayoutEmail(params: CoachWeeklyPayoutParams) {
  const {
    to, coachName, periodStart, periodEnd, sessions,
    totalSessions, totalCoachingFees, totalPayout,
  } = params

  try {
    const html = emailShell(`
      <p style="font-size: 17px; font-weight: 700; margin: 0 0 16px;">Your CoachNest payout has been processed</p>
      <p style="font-size: 14px; margin: 0 0 4px;">Hi ${escapeHtml(coachName)},</p>
      <p style="font-size: 14px; color: #4b5563; margin: 0 0 16px;">Your weekly CoachNest payout has been processed.</p>
      <p style="font-size: 14px; color: #4b5563; margin: 0 0 4px;">Here is a summary of your completed sessions for this payout period:</p>
      <p style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.03em; margin: 16px 0 0;">Payout Period</p>
      <p style="font-size: 14px; color: #1f2937; font-weight: 600; margin: 2px 0 0;">${escapeHtml(periodStart)} – ${escapeHtml(periodEnd)}</p>
      ${sessionsTable(sessions)}
      ${detailsTable([
        ['Total Sessions', String(totalSessions)],
        ['Total Coaching Fees', `R${totalCoachingFees}`],
        ['Total Payout', `R${totalPayout}`],
      ])}
      <p style="font-size: 14px; color: #4b5563; margin: 0 0 16px;">
        Your payout has been sent to your registered bank account. Please allow your bank's normal processing time for the funds to reflect.
      </p>
      ${ctaButton('VIEW EARNINGS', 'https://coachnest.co.za/dashboard/coach')}
      <p style="font-size: 14px; margin: 16px 0 0;">Thank you for being part of CoachNest.<br />The CoachNest Team</p>
    `)

    return await getResendClient().emails.send({
      from: NEW_FROM,
      to,
      replyTo: REPLY_TO,
      subject: `Your CoachNest payout for ${periodStart} – ${periodEnd} has been processed`,
      html,
    })
  } catch (err) {
    console.error('Failed to send coach weekly payout email:', err)
    return null
  }
}

// --- Email 9 — Coach Verification Status Update (Coach) -------------------

type VerificationStatus = 'id_verified' | 'qualification_verified' | 'verified'

interface VerificationStatusEmailParams {
  to: string
  coachName: string
  status: VerificationStatus
}

const VERIFICATION_STATUS_BODY: Record<VerificationStatus, string> = {
  id_verified: `
    <p style="font-size: 14px; color: #4b5563; margin: 0 0 16px;">
      Your ID has been verified on CoachNest.
      Please upload your coaching qualifications to complete full verification.
    </p>
  `,
  qualification_verified: `
    <p style="font-size: 14px; color: #4b5563; margin: 0 0 16px;">
      Your qualifications have been verified. Final review is in progress.
    </p>
  `,
  verified: `
    <p style="font-size: 14px; color: #4b5563; margin: 0 0 16px;">
      Great news — you are now a Fully Verified Coach on CoachNest!
      Your green Verified Coach badge is now live on your public profile,
      helping clients trust and choose you with confidence.
    </p>
  `,
}

export async function sendVerificationStatusEmail(params: VerificationStatusEmailParams) {
  const { to, coachName, status } = params

  try {
    const safeName = escapeHtml(coachName)
    const html = emailShell(`
      <p style="font-size: 17px; font-weight: 700; margin: 0 0 16px;">Your CoachNest profile has been verified ✓</p>
      <p style="font-size: 14px; margin: 0 0 4px;">Hi ${safeName},</p>
      ${VERIFICATION_STATUS_BODY[status]}
      ${ctaButton('VIEW YOUR PROFILE', 'https://coachnest.co.za/dashboard/coach/profile')}
      <p style="font-size: 14px; margin: 16px 0 0;">Thank you for being part of CoachNest.<br />The CoachNest Team</p>
    `)

    return await getResendClient().emails.send({
      from: NEW_FROM,
      to,
      replyTo: REPLY_TO,
      subject: 'Your CoachNest profile has been verified ✓',
      html,
    })
  } catch (err) {
    console.error('Failed to send verification status email:', err)
    return null
  }
}
