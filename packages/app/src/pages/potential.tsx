import { useState } from "react"

import { PageHeader } from "@/components/brand/page-header"
import { StockPotential } from "@/components/potential/stock-potential"
import { useCompanies } from "@/hooks/use-companies"
import { useGrants } from "@/hooks/use-grants"
import { cumulativeDilution, latestPriced, valuationOf } from "@/lib/company"

export function PotentialPage() {
  const { grants } = useGrants()
  const { companies } = useCompanies()
  // An exit is one company's, so the page simulates one at a time
  const held = companies.filter((c) => grants.some((g) => g.companyId === c.id))
  const [companyId, setCompanyId] = useState<string>()
  const company = held.find((c) => c.id === companyId) ?? held[0]
  const companyGrants = company
    ? grants.filter((g) => g.companyId === company.id)
    : grants
  // Today's valuation is the one that prices today's shares
  const priced = company && latestPriced(company)

  return (
    <div className="flex flex-col gap-line">
      <PageHeader
        title="Stock Potential"
        lede="Try an exit: a future valuation, the dilution still to come, and what your grants would pay."
      />
      <StockPotential
        // A new company starts its own rulers
        key={company?.id ?? "none"}
        grants={companyGrants}
        company={company}
        companies={held}
        onCompanyChange={setCompanyId}
        currentValuation={priced ? valuationOf(priced) : undefined}
        calculatedDilution={company ? cumulativeDilution(company) : undefined}
      />
    </div>
  )
}
