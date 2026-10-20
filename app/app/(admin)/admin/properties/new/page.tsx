import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { PropertyForm } from '@/components/admin/PropertyForm'

export default function NewPropertyPage() {
  return (
    <>
      <Link href="/admin/properties" className="mb-4 inline-flex items-center gap-1 text-sm text-grey-500 hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> All properties
      </Link>
      <PageHeader title="New property" description="You'll add packages, pricing and availability after saving." />
      <PropertyForm />
    </>
  )
}
