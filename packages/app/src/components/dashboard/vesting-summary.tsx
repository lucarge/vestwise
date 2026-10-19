import { useState } from "react"

import { Mark } from "@/components/brand/mark"
import { Part } from "@/components/brand/part"
import { RollingNumber } from "@/components/brand/rolling-number"
import { euro, month, percentPrecise, shares } from "@/lib/format"
import { usePortfolioSummary } from "@/hooks/use-portfolio-summary"
import { fitFigure } from "@/lib/utils"
import type { Grant } from "@/types/grant"
import type { ValuationEntry } from "@/types/valuation"

interface VestingSummaryProps {
  grants: Grant[]
  valuations: ValuationEntry[]
}

// The margin figure, brought to the top of the sheet: what has vested today,
// in euros, under the highlighter
export function VestingSummary({ grants, valuations }: VestingSummaryProps) {
  const [now] = useState(Date.now)
  const s = usePortfolioSummary(grants, valuations, now)
  const vested = euro(s.vestedNetValue)
  const across = grants.length > 1 ? ` across ${grants.length} grants` : ""

  return (
    <Part>
      <div className="grid gap-y-line lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-7">
          <p className="text-[0.9375rem] font-medium">Net value vested today</p>
          <p
            className="voice-figure fit-figure mt-3 [--fig:clamp(2.75rem,5vw,4.25rem)]"
            style={fitFigure(vested, 8)}
          >
            <Mark sweep="load" delay={200}>
              <RollingNumber value={vested} introDelay={150} />
            </Mark>
          </p>
          <p className="mt-4 max-w-[40ch] text-[0.9375rem] leading-snug text-ink-soft">
            {s.isFullyVested ? (
              <>
                All{" "}
                <span className="figures font-semibold text-ink">
                  {shares(s.totalShares)}
                </span>{" "}
                shares have vested{across}.
              </>
            ) : (
              <>
                <span className="figures font-semibold text-ink">
                  <RollingNumber value={shares(Math.round(s.vestedShares))} />
                </span>{" "}
                of {shares(s.totalShares)} shares{across}. Fully vested{" "}
                {s.fullVestingDate ? month(s.fullVestingDate) : "later"}.
              </>
            )}
          </p>
        </div>

        <div className="border-t border-ink pt-5 lg:col-span-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
          {s.isFullyVested ? (
            <>
              <p className="text-[0.9375rem] font-medium">In value</p>
              <p className="voice-figure mt-3 text-[1.75rem] lg:text-[2rem]">
                {euro(s.totalValue)}
              </p>
              <p className="mt-1.5 text-[0.9375rem] leading-snug text-ink-soft">
                before the strike price of {euro(s.totalStrikeCost)}
              </p>
            </>
          ) : (
            <>
              <p className="text-[0.9375rem] font-medium">Once fully vested</p>
              <p className="voice-figure mt-3 text-[1.75rem] lg:text-[2rem]">
                {euro(s.totalNetValue)}
              </p>
              <p className="mt-1.5 text-[0.9375rem] leading-snug text-ink-soft">
                net, on {euro(s.totalValue)} in value
              </p>
            </>
          )}
          {s.appreciationPct !== undefined && (
            <div className="mt-5 border-t border-ink pt-4">
              <p className="voice-figure text-[1.75rem]">
                {euro(s.vestedAppreciatedNetValue)}
              </p>
              <p className="mt-1.5 max-w-[34ch] text-[0.9375rem] leading-snug text-ink-soft">
                net vested at today's valuation,{" "}
                {s.appreciationPct >= 0 ? "up" : "down"}{" "}
                {percentPrecise(Math.abs(s.appreciationPct))} since the grants
              </p>
            </div>
          )}
          <p className="mt-5 text-[0.8125rem] leading-snug text-ink-muted">
            Net value is value minus strike price, before tax.
          </p>
        </div>
      </div>
    </Part>
  )
}
