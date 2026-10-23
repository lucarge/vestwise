import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

import { Part } from "@/components/brand/part"
import { Button } from "@/components/ui/button"
import { useVesting } from "@/hooks/use-vesting"
import { companyOf } from "@/lib/company"
import type { Company } from "@/types/company"
import type { Grant } from "@/types/grant"
import { CumulativeChart } from "./cumulative-chart"
import { GrantVestingChart } from "./grant-vesting-chart"
import { VestingSummary } from "./vesting-summary"
import { YearlySummary } from "./yearly-summary"

interface VestingDashboardProps {
  grants: Grant[]
  companies: Company[]
}

export function VestingDashboard({
  grants,
  companies,
}: VestingDashboardProps) {
  const { grantTimelines, cumulativeTimeline, yearlySummary } = useVesting(
    grants,
    companies
  )
  // Grants from more than one company say which granted them
  const manyCompanies = new Set(grants.map((g) => g.companyId)).size > 1

  if (grants.length === 0) {
    return (
      <div className="border-y border-ink">
        <div className="mx-auto flex min-h-[14rem] max-w-[36ch] flex-col items-center justify-center gap-5 py-line text-center">
          <h2 className="voice-display text-[1.5rem] lg:text-[1.75rem]">
            Add your first grant to draw your schedule.
          </h2>
          <Button size="lg" render={<Link to="/grants/new" />}>
            Add a grant
            <ArrowRight data-icon="inline-end" strokeWidth={2.25} />
          </Button>
          <p className="text-[0.8125rem] leading-snug text-ink-soft">
            Your grants stay in this browser. VestWise has no server.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-line">
      <VestingSummary grants={grants} companies={companies} />
      <CumulativeChart data={cumulativeTimeline} />
      <YearlySummary data={yearlySummary} />
      <Part
        title={grants.length === 1 ? "Your grant" : "Your grants"}
        description="Each grant as its own clause, with its schedule drawn beneath."
        action={
          <Button variant="outline" size="sm" render={<Link to="/grants" />}>
            Manage grants
          </Button>
        }
      >
        <div className="grid gap-x-12 gap-y-line md:grid-cols-2">
          {grants.map((grant, i) => (
            <GrantVestingChart
              key={grant.id}
              grant={grant}
              companyName={
                manyCompanies ? companyOf(grant, companies)?.name : undefined
              }
              timeline={grantTimelines[i]}
            />
          ))}
        </div>
      </Part>
    </div>
  )
}
