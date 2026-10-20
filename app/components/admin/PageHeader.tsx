import type { ReactNode } from 'react'

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl text-navy">{title}</h1>
        {description && <p className="mt-1 text-sm text-grey-500">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}

export function ComingSoon({ title, module }: { title: string; module: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="rounded-xl border border-dashed border-grey-300 bg-white p-12 text-center text-sm text-grey-500">
        This section is built in {module}.
      </div>
    </>
  )
}
