import type { SendResult } from '@/lib/email'

// Template messages must be pre-approved in 360dialog with these names and parameter order:
//   booking_confirmed  [guestName, propertyName, date, totalPrice, platformFee]
//   booking_cancelled  [guestName, propertyName, date]
//   booking_changed    [guestName, propertyName, newDate]
//   review_request     [guestName, propertyName, reviewLink]
//   arrival_reminder   [guestName, propertyName, date, amountDueOnArrival]
export type WhatsAppTemplate = 'booking_confirmed' | 'booking_cancelled' | 'booking_changed' | 'review_request' | 'arrival_reminder'

const TIMEOUT_MS = 10_000

export async function sendWhatsApp(to: string, template: WhatsAppTemplate, params: string[]): Promise<SendResult> {
  if (!process.env.WHATSAPP_API_KEY) return { ok: false, error: 'WHATSAPP_API_KEY is not configured' }
  try {
    const res = await fetch('https://waba.360dialog.io/v1/messages', {
      method: 'POST',
      headers: { 'D360-API-KEY': process.env.WHATSAPP_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace(/^\+/, ''),
        type: 'template',
        template: {
          name: template,
          language: { code: 'en' },
          components: [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }],
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (res.ok) return { ok: true }
    return { ok: false, error: `360dialog ${res.status}: ${(await res.text()).slice(0, 300)}` }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
