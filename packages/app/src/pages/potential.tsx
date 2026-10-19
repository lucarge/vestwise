import { PageHeader } from "@/components/brand/page-header"
import { StockPotential } from "@/components/potential/stock-potential"
import { useGrants } from "@/hooks/use-grants"
import { useValuations } from "@/hooks/use-valuations"
import { computeCumulativeDilution, getLatestValuation } from "@/lib/valuation"

export function PotentialPage() {
  const { grants } = useGrants()
  const { valuations } = useValuations()
  const latestValuation = getLatestValuation(valuations)
  const calculatedDilution = computeCumulativeDilution(valuations)

  return (
    <div className="flex flex-col gap-line">
      <PageHeader
        title="Stock Potential"
        lede="Try an exit: a future valuation, the dilution still to come, and what your grants would pay."
      />
      <StockPotential
        grants={grants}
        currentValuation={latestValuation?.valuation}
        calculatedDilution={calculatedDilution}
        valuations={valuations}
      />
    </div>
  )
}
