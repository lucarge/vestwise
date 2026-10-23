import { describe, expect, it } from "vitest"
import type { Company } from "@/types/company"
import type { Grant } from "@/types/grant"
import {
  type BackupData,
  MIGRATED_COMPANY_ID,
  fileMatchesSnapshot,
  isValidBackup,
  serializeSnapshot,
  upgradeBackup,
} from "./backup-data"
import { appreciation, ownership, sharesOf } from "./company"

// A version 2 grant and valuation as JSON held them
function storedGrant(overrides: Record<string, unknown> = {}) {
  return {
    id: "g1",
    grantDate: new Date(2023, 2, 1).toISOString(),
    vestingSchedule: "monthly",
    vestingPeriodMonths: 48,
    cliffMonths: 12,
    grantedAmount: 100,
    vsopsValue: 100_000,
    vsopsStrikePrice: 1,
    ...overrides,
  }
}

function storedValuation(id: string, date: Date, valuation: number, amountRaised?: number) {
  return {
    id,
    date: date.toISOString(),
    valuation,
    ...(amountRaised ? { amountRaised } : {}),
  }
}

// The worked example: a seed at €8M pre-money plus €2M, a Series A at €30M
// pre-money plus €10M, and a grant of 100 shares at €1,000 after the seed
function version2(overrides: Partial<BackupData> = {}): BackupData {
  return {
    version: 2,
    grants: [storedGrant()],
    valuations: [
      storedValuation("seed", new Date(2023, 0, 1), 8_000_000, 2_000_000),
      storedValuation("series-a", new Date(2025, 0, 1), 30_000_000, 10_000_000),
    ],
    columnConfig: [],
    ...overrides,
  }
}

// What the app reads back from storage: dates as Dates
function revive(data: BackupData): { grants: Grant[]; companies: Company[] } {
  return JSON.parse(JSON.stringify(data), (key, value) =>
    key === "date" || key === "grantDate" ? new Date(value) : value,
  )
}

describe("upgradeBackup", () => {
  it("prices the saved valuations from the grant and the amounts raised", () => {
    const upgraded = upgradeBackup(version2())
    expect(upgraded.version).toBe(3)
    expect(upgraded.valuations).toBeUndefined()

    const { grants, companies } = revive(upgraded)
    expect(grants[0].companyId).toBe(MIGRATED_COMPANY_ID)
    expect(companies).toHaveLength(1)

    const [company] = companies
    expect(company.name).toBe("Your company")
    expect(company.strikePrice).toBe(1)
    const [seed, seriesA] = company.valuations
    expect(seed).toMatchObject({ valuation: 10_000_000, pricePerShare: 1_000, amountRaised: 2_000_000 })
    expect(seriesA).toMatchObject({ valuation: 40_000_000, pricePerShare: 3_000, amountRaised: 10_000_000 })
    expect(sharesOf(seed)).toBe(10_000)
    expect(sharesOf(seriesA)).toBeCloseTo(13_333.33, 2)

    expect(appreciation(grants[0], company)).toBeCloseTo(3, 10)
    expect(ownership(grants[0], company)).toBeCloseTo(0.75, 10)
  })

  it("keeps today's figures when no amounts were raised", () => {
    const { grants, companies } = revive(
      upgradeBackup(
        version2({
          valuations: [
            storedValuation("seed", new Date(2023, 0, 1), 8_000_000),
            storedValuation("series-a", new Date(2025, 0, 1), 30_000_000),
          ],
        }),
      ),
    )
    expect(appreciation(grants[0], companies[0])).toBeCloseTo(3.75, 10)
    expect(ownership(grants[0], companies[0])).toBeCloseTo(1.25, 10)
  })

  it("prices from the earliest grant made under the latest valuation that saw one", () => {
    const { companies } = revive(
      upgradeBackup(
        version2({
          grants: [
            storedGrant({ id: "g0", grantDate: new Date(2022, 5, 1).toISOString(), vsopsValue: 50_000 }),
            storedGrant({ id: "g1" }),
            storedGrant({ id: "g2", grantDate: new Date(2024, 0, 1).toISOString(), vsopsValue: 150_000 }),
          ],
        }),
      ),
    )
    expect(companies[0].valuations.map((v) => v.pricePerShare)).toEqual([1_000, 3_000])
  })

  it("records later grants priced differently, as adding them would today", () => {
    const { grants, companies } = revive(
      upgradeBackup(
        version2({
          grants: [
            storedGrant({ id: "g1" }),
            storedGrant({ id: "g2", grantDate: new Date(2025, 5, 1).toISOString(), vsopsValue: 300_000 }),
            storedGrant({ id: "g3", grantDate: new Date(2026, 0, 1).toISOString(), vsopsValue: 400_000 }),
          ],
        }),
      ),
    )
    const valuations = companies[0].valuations
    expect(valuations).toHaveLength(3)
    expect(valuations[2]).toEqual({
      id: "migrated-g3",
      date: new Date(2026, 0, 1),
      pricePerShare: 4_000,
      grantId: "g3",
    })
    expect(appreciation(grants[0], companies[0])).toBeCloseTo(4, 10)
    expect(companies[0].strikePrice).toBe(1)
  })

  it("gives a company without saved valuations its prices from the grants", () => {
    const { companies } = revive(
      upgradeBackup(
        version2({
          valuations: [],
          grants: [
            storedGrant({ id: "g1", grantedAmount: 10_000, vsopsValue: 40_000 }),
            storedGrant({ id: "g2", grantDate: new Date(2025, 0, 1).toISOString(), grantedAmount: 2_000, vsopsValue: 24_000, vsopsStrikePrice: 2 }),
            storedGrant({ id: "g3", grantDate: new Date(2025, 5, 1).toISOString(), grantedAmount: 1_000, vsopsValue: 12_000, vsopsStrikePrice: 2 }),
          ],
        }),
      ),
    )
    const [company] = companies
    expect(company.valuations.map((v) => [v.id, v.pricePerShare])).toEqual([
      ["migrated-g1", 4],
      ["migrated-g2", 12],
    ])
    expect(company.strikePrice).toBe(2)
  })

  it("keeps valuations no grant can price as valuations alone", () => {
    const { companies } = revive(
      upgradeBackup(
        version2({
          valuations: [storedValuation("later", new Date(2024, 0, 1), 20_000_000, 5_000_000)],
          grants: [storedGrant({ grantDate: new Date(2023, 0, 1).toISOString() })],
        }),
      ),
    )
    expect(companies[0].valuations).toEqual([
      { id: "later", date: new Date(2024, 0, 1), valuation: 25_000_000, amountRaised: 5_000_000 },
    ])
  })

  it("creates no company when there is no data", () => {
    const upgraded = upgradeBackup({ version: 2, grants: [], valuations: [] })
    expect(upgraded.companies).toEqual([])
  })

  it("returns a version 3 backup as it is", () => {
    const current: BackupData = { version: 3, grants: [], companies: [] }
    expect(upgradeBackup(current)).toBe(current)
  })

  it("upgrades the same data to the same JSON every time", () => {
    expect(serializeSnapshot(upgradeBackup(version2()))).toBe(
      serializeSnapshot(upgradeBackup(version2())),
    )
  })
})

describe("isValidBackup", () => {
  it("accepts versions 1 to 3, version 3 with companies", () => {
    expect(isValidBackup({ version: 1, grants: [] })).toBe(true)
    expect(isValidBackup({ version: 2, grants: [], valuations: [] })).toBe(true)
    expect(isValidBackup({ version: 3, grants: [], companies: [] })).toBe(true)
    expect(isValidBackup({ version: 3, grants: [] })).toBe(false)
    expect(isValidBackup({ version: 4, grants: [], companies: [] })).toBe(false)
    expect(isValidBackup(null)).toBe(false)
  })
})

describe("fileMatchesSnapshot", () => {
  const snapshot = serializeSnapshot(upgradeBackup(version2()))

  it("reads a file from before companies as its upgrade", () => {
    expect(fileMatchesSnapshot(serializeSnapshot(version2()), snapshot)).toBe(true)
  })

  it("tells different data apart", () => {
    const other = version2({ grants: [storedGrant({ grantedAmount: 200 })] })
    expect(fileMatchesSnapshot(serializeSnapshot(other), snapshot)).toBe(false)
    expect(fileMatchesSnapshot("not json", snapshot)).toBe(false)
  })

  it("compares current files as they are", () => {
    expect(fileMatchesSnapshot(snapshot, snapshot)).toBe(true)
  })
})
