'use client'

// Last resort when the root layout itself fails: no app styles or fonts can be relied on here.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#F8F9FA', color: '#0D1B2A' }}>
        <main style={{ maxWidth: 480, margin: '15vh auto', padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 'normal' }}>DayUse is having a moment</h1>
          <p style={{ color: '#7A8694' }}>Something went wrong on our side. Nothing has been charged. Please try again.</p>
          <button onClick={reset} style={{ marginTop: 16, padding: '10px 20px', border: 0, borderRadius: 8, background: '#E8634A', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
