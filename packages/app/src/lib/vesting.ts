import { addMonths, getYear } from "date-fns"
import type { Company } from "@/types/company"
import type { Grant } from "@/types/grant"
import type {
  CumulativePoint,
  GrantVestingTimeline,
  VestingEvent,
  YearlySummary,
} from "@/types/vesting"
import { appreciationMultiplier, companyOf } from "@/lib/company"

function periodMonths(schedule: Grant["vestingSchedule"]): number {
  switch (schedule) {
    case "monthly":
      return 1
    case "quarterly":
      return 3
    case "yearly":
      return 12
  }
}

/**
 * Compute cumulative shares that should have vested by period i.
 * Uses integer-rounded proportional distribution to spread remainder
 * evenly across periods instead of dumping it all at the end.
 */
function cumulativeSharesAtPeriod(
  grantedAmount: number,
  i: number,
  totalPeriods: number,
): number {
  return (grantedAmount * i) / totalPeriods
}

export function computeGrantTimeline(grant: Grant): GrantVestingTimeline {
  const period = periodMonths(grant.vestingSchedule)
  const totalPeriods = Math.floor(grant.vestingPeriodMonths / period)
  if (totalPeriods === 0) {
    return { grantId: grant.id, events: [] }
  }

  const cliffDate = addMonths(grant.grantDate, grant.cliffMonths)
  const cliffPeriods = Math.floor(grant.cliffMonths / period)

  const events: VestingEvent[] = []
  let cumulativeVested = 0

  for (let i = 1; i <= totalPeriods; i++) {
    const date = addMonths(grant.grantDate, i * period)

    if (i <= cliffPeriods) {
      continue
    }

    // At the cliff boundary, emit all accumulated cliff shares first
    if (i === cliffPeriods + 1 && cliffPeriods > 0) {
      const cliffShares = cumulativeSharesAtPeriod(
        grant.grantedAmount,
        cliffPeriods,
        totalPeriods,
      )
      cumulativeVested += cliffShares
      events.push({
        date: cliffDate,
        sharesVested: cliffShares,
        cumulativeVested,
        unvested: grant.grantedAmount - cumulativeVested,
      })
    }

    // Regular vesting for the current period
    const targetCumulative = cumulativeSharesAtPeriod(
      grant.grantedAmount,
      i,
      totalPeriods,
    )
    const shares = targetCumulative - cumulativeVested
    if (shares > 0) {
      cumulativeVested = targetCumulative
      events.push({
        date,
        sharesVested: shares,
        cumulativeVested,
        unvested: grant.grantedAmount - cumulativeVested,
      })
    }
  }

  return { grantId: grant.id, events }
}

export function computeCumulativeTimeline(
  grants: Grant[],
  companies?: Company[],
): CumulativePoint[] {
  if (grants.length === 0) return []

  const timelines = grants.map(computeGrantTimeline)
  const totalShares = grants.reduce((s, g) => s + g.grantedAmount, 0)
  const valuesPerShare = grants.map((g) =>
    g.grantedAmount > 0 ? g.vsopsValue / g.grantedAmount : 0,
  )
  const totalValue = grants.reduce(
    (s, _, i) => s + grants[i].grantedAmount * valuesPerShare[i],
    0,
  )

  // Compute per-grant appreciation multipliers, each from its own company
  const appreciationMultipliers = companies
    ? grants.map((g) => appreciationMultiplier(g, companyOf(g, companies)))
    : grants.map(() => undefined)
  const hasAppreciation = appreciationMultipliers.some((m) => m !== undefined)

  // Collect all unique dates and sort
  const dateSet = new Map<number, Date>()
  for (const tl of timelines) {
    for (const ev of tl.events) {
      dateSet.set(ev.date.getTime(), ev.date)
    }
  }
  // Also add grant start dates
  for (const g of grants) {
    dateSet.set(g.grantDate.getTime(), g.grantDate)
  }

  const sortedDates = [...dateSet.values()].sort(
    (a, b) => a.getTime() - b.getTime(),
  )

  const points: CumulativePoint[] = []
  for (const date of sortedDates) {
    let totalVested = 0
    let totalVestedValue = 0
    let totalAppreciatedVestedValue = 0
    for (let j = 0; j < timelines.length; j++) {
      const tl = timelines[j]
      // Find the last event at or before this date
      let vested = 0
      for (const ev of tl.events) {
        if (ev.date.getTime() <= date.getTime()) {
          vested = ev.cumulativeVested
        }
      }
      totalVested += vested
      totalVestedValue += vested * valuesPerShare[j]
      totalAppreciatedVestedValue +=
        vested * valuesPerShare[j] * (appreciationMultipliers[j] ?? 1)
    }
    points.push({
      date,
      totalVested,
      totalUnvested: totalShares - totalVested,
      totalVestedValue,
      totalUnvestedValue: totalValue - totalVestedValue,
      ...(hasAppreciation
        ? { totalAppreciatedVestedValue }
        : {}),
    })
  }

  return points
}

export function computeYearlySummary(grants: Grant[]): YearlySummary[] {
  if (grants.length === 0) return []

  const timelines = grants.map((g) => ({
    grant: g,
    timeline: computeGrantTimeline(g),
  }))

  const yearMap = new Map<
    number,
    { shares: number; value: number; strikeCost: number }
  >()

  for (const { grant, timeline } of timelines) {
    const valuePerShare =
      grant.grantedAmount > 0 ? grant.vsopsValue / grant.grantedAmount : 0

    for (const ev of timeline.events) {
      const year = getYear(ev.date)
      const existing = yearMap.get(year) ?? {
        shares: 0,
        value: 0,
        strikeCost: 0,
      }
      existing.shares += ev.sharesVested
      existing.value += ev.sharesVested * valuePerShare
      existing.strikeCost += ev.sharesVested * grant.vsopsStrikePrice
      yearMap.set(year, existing)
    }
  }

  return [...yearMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, data]) => ({
      year,
      sharesVesting: data.shares,
      valueVesting: data.value,
      netValueVesting: data.value - data.strikeCost,
    }))
}
