import { describe, expect, it } from "vitest"
import type { Grant } from "@/types/grant"
import {
  computeGrantTimeline,
  computeCumulativeTimeline,
  computeYearlySummary,
} from "./vesting"

function makeGrant(overrides: Partial<Grant> = {}): Grant {
  return {
    id: "test-1",
    companyId: "company-1",
    grantDate: new Date(2023, 2, 1), // March 1, 2023
    vestingSchedule: "quarterly",
    vestingPeriodMonths: 48,
    cliffMonths: 12,
    grantedAmount: 12,
    vsopsValue: 1200,
    vsopsStrikePrice: 10,
    ...overrides,
  }
}

describe("computeGrantTimeline", () => {
  it("distributes 12 shares across 16 quarterly periods with 12mo cliff", () => {
    const grant = makeGrant()
    const { events } = computeGrantTimeline(grant)

    // Total shares must equal granted amount
    const totalVested = events.reduce((s, e) => s + e.sharesVested, 0)
    expect(totalVested).toBe(12)

    // Last event must have 0 unvested
    expect(events[events.length - 1].unvested).toBe(0)
    expect(events[events.length - 1].cumulativeVested).toBe(12)
  })

  it("vests cliff shares at the cliff date, not the end", () => {
    const grant = makeGrant()
    const { events } = computeGrantTimeline(grant)

    // Cliff date is March 1, 2024
    const cliffEvent = events[0]
    expect(cliffEvent.date).toEqual(new Date(2024, 2, 1))
    // 12 shares * 4 cliff periods / 16 total periods = 3 shares at cliff
    expect(cliffEvent.sharesVested).toBe(3)
  })

  it("vests shares gradually after the cliff, not all at the end", () => {
    const grant = makeGrant()
    const { events } = computeGrantTimeline(grant)

    // Should have events spread across 2024-2027, not just 2027
    const years = events.map((e) => e.date.getFullYear())
    const uniqueYears = [...new Set(years)]
    expect(uniqueYears).toContain(2024)
    expect(uniqueYears).toContain(2025)
    expect(uniqueYears).toContain(2026)
    expect(uniqueYears).toContain(2027)
  })

  it("never has a single event with all shares at the end period", () => {
    const grant = makeGrant()
    const { events } = computeGrantTimeline(grant)

    // The last event should NOT have all 12 shares
    const lastEvent = events[events.length - 1]
    expect(lastEvent.sharesVested).toBeLessThan(grant.grantedAmount)
  })

  it("handles evenly divisible shares (1000 shares, 48mo monthly, 12mo cliff)", () => {
    const grant = makeGrant({
      grantedAmount: 1000,
      vestingSchedule: "monthly",
      vestingPeriodMonths: 48,
      cliffMonths: 12,
    })
    const { events } = computeGrantTimeline(grant)

    const totalVested = events.reduce((s, e) => s + e.sharesVested, 0)
    expect(totalVested).toBe(1000)

    // Cliff at month 12: floor(1000 * 12 / 48) = 250
    const cliffEvent = events[0]
    expect(cliffEvent.date).toEqual(new Date(2024, 2, 1))
    expect(cliffEvent.sharesVested).toBe(250)
  })

  it("handles no cliff (cliffMonths = 0)", () => {
    const grant = makeGrant({ cliffMonths: 0 })
    const { events } = computeGrantTimeline(grant)

    const totalVested = events.reduce((s, e) => s + e.sharesVested, 0)
    expect(totalVested).toBe(12)

    // No cliff event — first event should be a regular vesting period
    // With 12 shares / 16 periods, period 1 gets 0 shares (skipped),
    // first non-zero event is at period 2 (Sep 1, 2023)
    expect(events[0].date.getFullYear()).toBe(2023)
    expect(events.every((e) => e.sharesVested > 0)).toBe(true)
  })

  it("handles yearly vesting with cliff", () => {
    const grant = makeGrant({
      grantedAmount: 100,
      vestingSchedule: "yearly",
      vestingPeriodMonths: 48,
      cliffMonths: 12,
    })
    const { events } = computeGrantTimeline(grant)

    const totalVested = events.reduce((s, e) => s + e.sharesVested, 0)
    expect(totalVested).toBe(100)

    // 4 yearly periods, 1 cliff period → cliff vests 25 shares at year 1
    expect(events[0].sharesVested).toBe(25)
    expect(events[0].date).toEqual(new Date(2024, 2, 1))
  })

  it("produces monotonically increasing cumulativeVested", () => {
    const grant = makeGrant({ grantedAmount: 1000, vestingSchedule: "monthly" })
    const { events } = computeGrantTimeline(grant)

    for (let i = 1; i < events.length; i++) {
      expect(events[i].cumulativeVested).toBeGreaterThanOrEqual(
        events[i - 1].cumulativeVested,
      )
    }
  })
})

describe("computeYearlySummary", () => {
  it("spreads shares across multiple years for the user's example grant", () => {
    const grant = makeGrant()
    const summary = computeYearlySummary([grant])

    // Should have entries for 2024, 2025, 2026, 2027
    const years = summary.map((s) => s.year)
    expect(years).toEqual([2024, 2025, 2026, 2027])

    // Total across all years must be 12
    const totalShares = summary.reduce((s, row) => s + row.sharesVesting, 0)
    expect(totalShares).toBe(12)

    // NOT all in 2027
    const y2027 = summary.find((s) => s.year === 2027)!
    expect(y2027.sharesVesting).toBeLessThan(12)
  })

  it("computes proportional value per year", () => {
    const grant = makeGrant({ vsopsValue: 1200, grantedAmount: 12 })
    const summary = computeYearlySummary([grant])

    const totalValue = summary.reduce((s, row) => s + row.valueVesting, 0)
    expect(totalValue).toBe(1200)
  })
})

describe("computeCumulativeTimeline", () => {
  it("starts at 0 vested and ends fully vested", () => {
    const grant = makeGrant()
    const timeline = computeCumulativeTimeline([grant])

    expect(timeline[0].totalVested).toBe(0)
    expect(timeline[timeline.length - 1].totalVested).toBe(12)
    expect(timeline[timeline.length - 1].totalUnvested).toBe(0)
  })

  it("has monotonically increasing vested shares", () => {
    const grant = makeGrant({ grantedAmount: 1000, vestingSchedule: "monthly" })
    const timeline = computeCumulativeTimeline([grant])

    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i].totalVested).toBeGreaterThanOrEqual(
        timeline[i - 1].totalVested,
      )
    }
  })
})
