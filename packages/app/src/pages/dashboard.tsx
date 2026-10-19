import { PageHeader } from "@/components/brand/page-header"
import { VestingDashboard } from "@/components/dashboard/vesting-dashboard"
import { useGrants } from "@/hooks/use-grants"
import { useValuations } from "@/hooks/use-valuations"

export function DashboardPage() {
  const { grants } = useGrants()
  const { valuations } = useValuations()

  return (
    <div className="flex flex-col gap-line">
      <PageHeader
        title="Dashboard"
        lede="What has vested, when the rest vests, and what it is worth today."
      />
      <VestingDashboard grants={grants} valuations={valuations} />
    </div>
  )
}
