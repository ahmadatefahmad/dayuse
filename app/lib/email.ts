import { Resend } from 'resend'

export type SendResult = { ok: true } | { ok: false; error: string }

// Resend's shared test sender works without a verified domain, but only delivers to your own address.
const FROM = process.env.EMAIL_FROM || 'DayUse Egypt <onboarding@resend.dev>'

let client: Resend | null = null

export async function sendEmail(to: string, subject: string, html: string): Promise<SendResult> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY is not configured' }
  client ??= new Resend(process.env.RESEND_API_KEY)
  try {
    const { error } = await client.emails.send({ from: FROM, to, subject, html })
    return error ? { ok: false, error: `${error.name}: ${error.message}` } : { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
