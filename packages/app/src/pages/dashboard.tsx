import { PageHeader } from "@/components/brand/page-header"
import { VestingDashboard } from "@/components/dashboard/vesting-dashboard"
import { useCompanies } from "@/hooks/use-companies"
import { useGrants } from "@/hooks/use-grants"

export function DashboardPage() {
  const { grants } = useGrants()
  const { companies } = useCompanies()

  return (
    <div className="flex flex-col gap-line">
      <PageHeader
        title="Dashboard"
        lede="What has vested, when the rest vests, and what it is worth today."
      />
      <VestingDashboard grants={grants} companies={companies} />
    </div>
  )
}
