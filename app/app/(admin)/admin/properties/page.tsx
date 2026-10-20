import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { PropertiesTable } from '@/components/admin/PropertiesTable'
import { buttonClasses } from '@/components/ui/Button'

export default function PropertiesPage() {
  return (
    <>
      <PageHeader
        title="Properties"
        description="Hotels, beach clubs and resorts listed on DayUse."
        actions={
          <Link href="/admin/properties/new" className={buttonClasses()}>
            <Plus className="h-4 w-4" />
            New property
          </Link>
        }
      />
      <PropertiesTable />
    </>
  )
}
