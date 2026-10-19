import { useMemo } from "react"

import { getAppreciationMultiplier } from "@/lib/valuation"
import { computeGrantTimeline } from "@/lib/vesting"
import type { Grant } from "@/types/grant"
import type { ValuationEntry } from "@/types/valuation"

// What every grant adds up to: vested today, in full once vested, and at
// today's valuation when there is one
export function usePortfolioSummary(
  grants: Grant[],
  valuations: ValuationEntry[],
  now: number
) {
  return useMemo(() => {
    const timelines = grants.map((g) => ({
      grant: g,
      timeline: computeGrantTimeline(g),
    }))

    let vestedShares = 0
    let vestedValue = 0
    let vestedStrikeCost = 0
    let vestedAppreciatedValue = 0
    let hasAppreciation = false
    let fullVestingDate: Date | null = null

    for (const { grant, timeline } of timelines) {
      const valuePerShare =
        grant.grantedAmount > 0 ? grant.vsopsValue / grant.grantedAmount : 0
      const multiplier = getAppreciationMultiplier(valuations, grant.grantDate)
      const effectiveMultiplier = multiplier ?? 1
      if (multiplier !== undefined) hasAppreciation = true

      let grantVested = 0
      for (const ev of timeline.events) {
        if (ev.date.getTime() <= now) {
          grantVested = ev.cumulativeVested
        }
      }
      vestedShares += grantVested
      vestedValue += grantVested * valuePerShare
      vestedStrikeCost += grantVested * grant.vsopsStrikePrice
      vestedAppreciatedValue +=
        grantVested * valuePerShare * effectiveMultiplier

      const lastEvent = timeline.events[timeline.events.length - 1]
      if (lastEvent) {
        if (!fullVestingDate || lastEvent.date > fullVestingDate) {
          fullVestingDate = lastEvent.date
        }
      }
    }

    const totalShares = grants.reduce((s, g) => s + g.grantedAmount, 0)
    const totalValue = grants.reduce((s, g) => s + g.vsopsValue, 0)
    const totalStrikeCost = grants.reduce(
      (s, g) => s + g.vsopsStrikePrice * g.grantedAmount,
      0
    )

    const appreciationPct =
      hasAppreciation && vestedValue > 0
        ? ((vestedAppreciatedValue - vestedValue) / vestedValue) * 100
        : undefined

    return {
      vestedShares,
      vestedNetValue: vestedValue - vestedStrikeCost,
      vestedValue,
      vestedAppreciatedValue,
      vestedAppreciatedNetValue: vestedAppreciatedValue - vestedStrikeCost,
      totalShares,
      totalNetValue: totalValue - totalStrikeCost,
      totalValue,
      totalStrikeCost,
      fullVestingDate,
      isFullyVested: fullVestingDate ? now >= fullVestingDate.getTime() : false,
      appreciationPct,
    }
  }, [grants, valuations, now])
}
