// Email-safe HTML: tables + inline styles, no external CSS or fonts.

export const COLORS = { navy: '#0D1B2A', coral: '#E8634A', teal: '#2BBFA4', sand: '#E8D5B0', grey50: '#F8F9FA', grey300: '#C8CDD4', grey500: '#7A8694', grey700: '#3D4855' }

// Everything that came from a guest or admin must go through this before landing in HTML.
export function esc(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="background:${COLORS.coral};border-radius:8px">
  <a href="${esc(href)}" style="display:inline-block;padding:12px 24px;color:#fff;font-weight:600;text-decoration:none;font-family:Arial,sans-serif">${esc(label)}</a>
</td></tr></table>`
}

// Label/value rows, e.g. date, package, guests.
export function details(rows: [string, string][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0">${rows
    .map(
      ([k, v]) => `<tr>
  <td style="padding:8px 0;border-bottom:1px solid #F0F2F4;color:${COLORS.grey500};font-size:14px">${esc(k)}</td>
  <td style="padding:8px 0;border-bottom:1px solid #F0F2F4;color:${COLORS.navy};font-size:14px;font-weight:600;text-align:right">${esc(v)}</td>
</tr>`,
    )
    .join('')}</table>`
}

// The pay-now / pay-on-arrival split, shown in every guest email about a live booking.
export function paymentSplit(paidOnline: string, dueOnArrival: string, propertyName: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:2px solid ${COLORS.teal};border-radius:10px;background:#EAF8F5">
<tr><td style="padding:16px 20px;font-family:Arial,sans-serif">
  <p style="margin:0;color:${COLORS.navy};font-size:16px;font-weight:700">Pay ${esc(dueOnArrival)} on arrival</p>
  <p style="margin:6px 0 0;color:${COLORS.grey700};font-size:14px">Paid directly to ${esc(propertyName)} at reception. Booking fee paid online: ${esc(paidOnline)}.</p>
</td></tr></table>`
}

export function layout({ preheader, title, body }: { preheader: string; title: string; body: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.grey50}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.grey50}"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden">
    <tr><td style="background:${COLORS.navy};padding:24px 32px">
      <a href="${esc(appUrl)}" style="color:#fff;text-decoration:none;font-family:Georgia,'Times New Roman',serif;font-size:26px">DayUse</a>
      <span style="color:${COLORS.sand};font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-left:8px">Egypt</span>
    </td></tr>
    <tr><td style="padding:32px;font-family:Arial,sans-serif;color:${COLORS.grey700};font-size:15px;line-height:1.6">
      <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;color:${COLORS.navy};font-size:26px;line-height:1.3">${esc(title)}</h1>
      ${body}
    </td></tr>
    <tr><td style="padding:20px 32px;background:${COLORS.grey50};font-family:Arial,sans-serif;color:${COLORS.grey500};font-size:12px;line-height:1.5">
      DayUse Egypt — day passes to hotels, beach clubs and resorts.<br>
      You're receiving this because of a booking made on <a href="${esc(appUrl)}" style="color:${COLORS.grey500}">DayUse</a>.
    </td></tr>
  </table>
</td></tr></table>
</body></html>`
}
