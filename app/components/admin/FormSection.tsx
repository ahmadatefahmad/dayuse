import type { ReactNode } from 'react'

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-grey-100 bg-white p-5 md:p-6">
      <h2 className="text-lg text-navy">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-grey-500">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  )
}

// Sticky bar at the bottom of long forms holding status text and the save button.
export function FormActions({ status, children }: { status?: ReactNode; children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-grey-100 bg-white/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
      {status && <div className="mr-auto text-sm">{status}</div>}
      {children}
    </div>
  )
}
