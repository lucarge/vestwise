import { useMemo } from "react"

import { appreciationMultiplier, companyOf } from "@/lib/company"
import { computeGrantTimeline } from "@/lib/vesting"
import type { Company } from "@/types/company"
import type { Grant } from "@/types/grant"

// What every grant adds up to: vested today, in full once vested, and at
// today's price per share where its company has one
export function usePortfolioSummary(
  grants: Grant[],
  companies: Company[],
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
      const multiplier = appreciationMultiplier(
        grant,
        companyOf(grant, companies)
      )
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
  }, [grants, companies, now])
}
