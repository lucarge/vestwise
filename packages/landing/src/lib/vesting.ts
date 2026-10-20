// Vesting and payout math, ported from the app (packages/app/src/lib/vesting.ts
// and potential.ts) so the landing's figures match what visitors will see there.

export type Schedule = "monthly" | "quarterly" | "yearly"

export interface GrantTerms {
  shares: number
  valuePerShare: number
  strike: number
  schedule: Schedule
  periodMonths: number
  cliffMonths: number
  start: Date
}

export interface VestEvent {
  date: Date
  shares: number
  cumulative: number
}

export const SCHEDULE_MONTHS: Record<Schedule, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
}

// Same semantics as date-fns addMonths: keeps the day, clamped to month end
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()
  result.setDate(Math.min(date.getDate(), lastDay))
  return result
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function termsProblem(t: GrantTerms): string | null {
  if (!(t.shares > 0)) return "Enter how many virtual shares you were granted."
  if (!(t.strike > 0)) return "The strike price has to be above zero."
  if (!(t.periodMonths >= 1)) return "The vesting period has to be at least one month."
  if (t.cliffMonths >= t.periodMonths) return "The cliff has to be shorter than the vesting period."
  if (Math.floor(t.periodMonths / SCHEDULE_MONTHS[t.schedule]) === 0) {
    return "The vesting period is shorter than one instalment."
  }
  return null
}

// At the cliff every instalment accrued so far vests at once; afterwards
// shares vest linearly, one instalment per period
export function vestingEvents(t: GrantTerms): VestEvent[] {
  const period = SCHEDULE_MONTHS[t.schedule]
  const totalPeriods = Math.floor(t.periodMonths / period)
  if (totalPeriods === 0 || !(t.shares > 0)) return []

  const cliffPeriods = Math.floor(t.cliffMonths / period)
  const events: VestEvent[] = []
  let cumulative = 0

  for (let i = 1; i <= totalPeriods; i++) {
    if (i <= cliffPeriods) continue

    if (i === cliffPeriods + 1 && cliffPeriods > 0) {
      const cliffShares = (t.shares * cliffPeriods) / totalPeriods
      cumulative += cliffShares
      events.push({ date: addMonths(t.start, t.cliffMonths), shares: cliffShares, cumulative })
    }

    const target = (t.shares * i) / totalPeriods
    const shares = target - cumulative
    if (shares > 0) {
      cumulative = target
      events.push({ date: addMonths(t.start, i * period), shares, cumulative })
    }
  }

  return events
}

export function vestedAt(events: VestEvent[], date: Date): number {
  let vested = 0
  for (const ev of events) {
    if (ev.date.getTime() <= date.getTime()) vested = ev.cumulative
    else break
  }
  return vested
}

export interface GrantSummary {
  vestedShares: number
  vestedNet: number
  totalNet: number
  netPerShare: number
  underwater: boolean
  cliffDate: Date
  fullyVestedDate: Date
  remainingInstalments: number
  nextVest: VestEvent | null
}

export function summarize(t: GrantTerms, events: VestEvent[], today: Date): GrantSummary {
  const vestedShares = vestedAt(events, today)
  const netPerShare = t.valuePerShare - t.strike
  const underwater = netPerShare < 0
  const perShare = Math.max(0, netPerShare)
  const upcoming = events.filter((ev) => ev.date.getTime() > today.getTime())

  return {
    vestedShares,
    vestedNet: vestedShares * perShare,
    totalNet: t.shares * perShare,
    netPerShare,
    underwater,
    cliffDate: addMonths(t.start, t.cliffMonths),
    fullyVestedDate: events.length > 0 ? events[events.length - 1].date : t.start,
    remainingInstalments: upcoming.length,
    nextVest: upcoming[0] ?? null,
  }
}

export interface YearRow {
  year: number
  shares: number
  net: number
}

export function yearlySummary(grants: { terms: GrantTerms; events: VestEvent[] }[]): YearRow[] {
  const years = new Map<number, YearRow>()
  for (const { terms, events } of grants) {
    const perShare = Math.max(0, terms.valuePerShare - terms.strike)
    for (const ev of events) {
      const year = ev.date.getFullYear()
      const row = years.get(year) ?? { year, shares: 0, net: 0 }
      row.shares += ev.shares
      row.net += ev.shares * perShare
      years.set(year, row)
    }
  }
  return [...years.values()].sort((a, b) => a.year - b.year)
}

export interface Payout {
  grossAtExit: number
  strikeCost: number
  beforeDilution: number
  dilutionCost: number
  net: number
  todayNet: number
  pricePerShare: number
}

// Mirrors the app's Stock Potential: the multiple applies to the whole grant,
// a grant worth less than its strike cost counts as zero, and dilution comes
// off the result
export function payout(grants: GrantTerms[], multiple: number, dilutionPercent: number): Payout {
  let grossAtExit = 0
  let strikeCost = 0
  let beforeDilution = 0
  let todayNet = 0
  let shares = 0

  for (const g of grants) {
    const gross = g.shares * g.valuePerShare * multiple
    const cost = g.shares * g.strike
    grossAtExit += gross
    strikeCost += cost
    beforeDilution += Math.max(0, gross - cost)
    todayNet += Math.max(0, g.shares * g.valuePerShare - cost)
    shares += g.shares
  }

  const net = beforeDilution * (1 - dilutionPercent / 100)
  return {
    grossAtExit,
    strikeCost,
    beforeDilution,
    dilutionCost: beforeDilution - net,
    net,
    todayNet,
    pricePerShare: shares > 0 ? grossAtExit / shares : 0,
  }
}
