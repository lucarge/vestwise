import { describe, expect, it } from "vitest"
import type { Company } from "@/types/company"
import type { Grant } from "@/types/grant"
import {
  appreciation,
  appreciationMultiplier,
  cumulativeDilution,
  findCompany,
  linkGrant,
  ownership,
  priceOf,
  sharesOf,
  valuationAt,
  valuationOf,
} from "./company"

// The worked example: a seed round at €8M pre-money plus €2M leaves 10,000
// shares at €1,000; a Series A at €30M pre-money plus €10M prices a share at
// €3,000 and leaves 13,333
function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: "acme",
    name: "Acme GmbH",
    strikePrice: 1,
    valuations: [
      {
        id: "seed",
        date: new Date(2023, 0, 1),
        valuation: 10_000_000,
        shares: 10_000,
        amountRaised: 2_000_000,
      },
      {
        id: "series-a",
        date: new Date(2025, 0, 1),
        valuation: 40_000_000,
        pricePerShare: 3_000,
        amountRaised: 10_000_000,
      },
    ],
    ...overrides,
  }
}

function makeGrant(overrides: Partial<Grant> = {}): Grant {
  return {
    id: "grant-1",
    companyId: "acme",
    grantDate: new Date(2023, 2, 1),
    vestingSchedule: "monthly",
    vestingPeriodMonths: 48,
    cliffMonths: 12,
    grantedAmount: 100,
    vsopsValue: 100_000,
    vsopsStrikePrice: 1,
    ...overrides,
  }
}

function ids(prefix = "id") {
  let n = 0
  return () => `${prefix}-${++n}`
}

describe("an entry's figures", () => {
  it("works out the third figure from any two", () => {
    expect(priceOf({ id: "a", date: new Date(), valuation: 10_000_000, shares: 10_000 })).toBe(1_000)
    expect(sharesOf({ id: "a", date: new Date(), valuation: 40_000_000, pricePerShare: 3_000 })).toBeCloseTo(13_333.33, 2)
    expect(valuationOf({ id: "a", date: new Date(), shares: 10_000, pricePerShare: 1_000 })).toBe(10_000_000)
  })

  it("leaves what a single figure can't give unknown", () => {
    const entry = { id: "a", date: new Date(), valuation: 10_000_000 }
    expect(priceOf(entry)).toBeUndefined()
    expect(sharesOf(entry)).toBeUndefined()
    expect(valuationOf(entry)).toBe(10_000_000)
  })
})

describe("valuationAt", () => {
  it("finds the valuation in effect on a date", () => {
    const company = makeCompany()
    expect(valuationAt(company, new Date(2024, 5, 1))?.id).toBe("seed")
    expect(valuationAt(company, new Date(2025, 0, 1))?.id).toBe("series-a")
    expect(valuationAt(company, new Date(2022, 0, 1))).toBeUndefined()
  })
})

describe("a grant against its company", () => {
  it("appreciates by price per share, not by valuation", () => {
    // Valuations grew ×3.75 pre-money to pre-money; a share grew ×3
    expect(appreciation(makeGrant(), makeCompany())).toBeCloseTo(3, 10)
  })

  it("owns its share of the latest share count, after dilution", () => {
    expect(ownership(makeGrant(), makeCompany())).toBeCloseTo(0.75, 10)
  })

  it("holds at its own price when no valuation came after it", () => {
    const grant = makeGrant({ grantDate: new Date(2026, 0, 1), vsopsValue: 400_000 })
    expect(appreciation(grant, makeCompany())).toBe(1)
    expect(appreciationMultiplier(grant, makeCompany())).toBeUndefined()
  })

  it("reports no multiplier while the price holds", () => {
    const grant = makeGrant({ grantDate: new Date(2025, 0, 1), vsopsValue: 300_000 })
    expect(appreciation(grant, makeCompany())).toBe(1)
    expect(appreciationMultiplier(grant, makeCompany())).toBeUndefined()
  })

  it("has no appreciation while no valuation prices a share", () => {
    const company = makeCompany({
      valuations: [{ id: "seed", date: new Date(2023, 0, 1), valuation: 8_000_000 }],
    })
    expect(appreciation(makeGrant(), company)).toBeUndefined()
  })

  it("has no ownership without a share count on record", () => {
    const company = makeCompany({
      valuations: [{ id: "only", date: new Date(2023, 0, 1), pricePerShare: 1_000 }],
    })
    expect(ownership(makeGrant(), company)).toBeUndefined()
  })
})

describe("cumulativeDilution", () => {
  it("multiplies what each round leaves, on post-money figures", () => {
    // The seed leaves 8/10, the Series A 30/40: 0.6 kept, 40% diluted
    expect(cumulativeDilution(makeCompany())).toBeCloseTo(40, 10)
  })
})

describe("findCompany", () => {
  it("matches names whatever their case and spacing", () => {
    expect(findCompany([makeCompany()], "  acme gmbh ")?.id).toBe("acme")
    expect(findCompany([makeCompany()], "Acme")).toBeUndefined()
    expect(findCompany([makeCompany()], " ")).toBeUndefined()
  })
})

describe("linkGrant", () => {
  it("makes a new company from the grant's own terms", () => {
    const grant = makeGrant({ vsopsStrikePrice: 2 })
    const link = linkGrant(grant, " Beta Labs SE ", [makeCompany()], ids())
    expect(link.change).toBe("creates")
    expect(link.company).toEqual({
      id: "id-1",
      name: "Beta Labs SE",
      strikePrice: 2,
      valuations: [
        { id: "id-2", date: grant.grantDate, pricePerShare: 1_000, grantId: "grant-1" },
      ],
    })
    expect(link.grant.companyId).toBe("id-1")
  })

  it("links an older grant without touching the company", () => {
    const link = linkGrant(makeGrant(), "Acme GmbH", [makeCompany()], ids())
    expect(link.grant.companyId).toBe("acme")
    expect(link.company).toBeUndefined()
    expect(link.change).toBeUndefined()
  })

  it("leaves the company alone when a newer grant has the same price", () => {
    const grant = makeGrant({ grantDate: new Date(2025, 5, 1), vsopsValue: 300_000 })
    expect(linkGrant(grant, "Acme GmbH", [makeCompany()], ids()).company).toBeUndefined()
  })

  it("records a newer grant's price on the company", () => {
    const grant = makeGrant({ grantDate: new Date(2026, 0, 1), vsopsValue: 400_000 })
    const link = linkGrant(grant, "Acme GmbH", [makeCompany()], ids())
    expect(link.change).toBe("records")
    expect(link.company?.valuations.at(-1)).toEqual({
      id: "id-1",
      date: grant.grantDate,
      pricePerShare: 4_000,
      grantId: "grant-1",
    })
  })

  it("keeps an entry recorded from the grant in step with its edits", () => {
    const grant = makeGrant({ grantDate: new Date(2026, 0, 1), vsopsValue: 400_000 })
    const recorded = linkGrant(grant, "Acme GmbH", [makeCompany()], ids()).company!

    const unchanged = linkGrant(grant, "Acme GmbH", [recorded], ids())
    expect(unchanged.company).toBeUndefined()

    const edited = { ...grant, grantDate: new Date(2026, 1, 1), vsopsValue: 450_000 }
    const link = linkGrant(edited, "Acme GmbH", [recorded], ids())
    expect(link.change).toBe("updates")
    expect(link.company?.valuations).toHaveLength(3)
    expect(link.company?.valuations.at(-1)).toMatchObject({
      date: edited.grantDate,
      pricePerShare: 4_500,
      grantId: "grant-1",
    })
  })
})
