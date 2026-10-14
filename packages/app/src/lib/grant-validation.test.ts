import { describe, expect, it } from "vitest"
import type { GrantFormData } from "@/types/grant"
import { validateGrantForm } from "./grant-validation"

function makeForm(overrides: Partial<GrantFormData> = {}): GrantFormData {
  return {
    grantDate: new Date(2024, 6, 1), // July 1, 2024
    vestingSchedule: "monthly",
    vestingPeriodMonths: "48",
    cliffMonths: "12",
    grantedAmount: "10000",
    vsopsValue: "4",
    vsopsStrikePrice: "1",
    ...overrides,
  }
}

describe("validateGrantForm", () => {
  it("accepts a complete grant", () => {
    expect(validateGrantForm(makeForm())).toBeNull()
  })

  it("accepts no cliff and fractional shares", () => {
    expect(
      validateGrantForm(makeForm({ cliffMonths: "0", grantedAmount: "1250.5" })),
    ).toBeNull()
  })

  it("requires a grant date", () => {
    expect(validateGrantForm(makeForm({ grantDate: undefined }))).toEqual({
      grantDate: "Required",
    })
  })

  it.each(["", "0", "-12", "abc"])(
    "rejects a vesting period of %j",
    (vestingPeriodMonths) => {
      expect(
        validateGrantForm(makeForm({ vestingPeriodMonths }))?.vestingPeriodMonths,
      ).toBe("Must be at least 1")
    },
  )

  it.each(["", "-1", "abc"])("rejects a cliff of %j", (cliffMonths) => {
    expect(validateGrantForm(makeForm({ cliffMonths }))?.cliffMonths).toBe(
      "Must be 0 or more",
    )
  })

  it.each(["48", "60"])(
    "rejects a %s-month cliff on a 48-month vesting period",
    (cliffMonths) => {
      expect(validateGrantForm(makeForm({ cliffMonths }))?.cliffMonths).toBe(
        "Must be less than vesting period",
      )
    },
  )

  it.each(["grantedAmount", "vsopsValue", "vsopsStrikePrice"] as const)(
    "requires %s to be above zero",
    (field) => {
      for (const value of ["", "0", "-5", "abc"]) {
        expect(validateGrantForm(makeForm({ [field]: value }))?.[field]).toBe(
          "Must be greater than 0",
        )
      }
    },
  )

  it("reports every problem at once", () => {
    const errors = validateGrantForm(
      makeForm({ grantDate: undefined, cliffMonths: "48", vsopsStrikePrice: "0" }),
    )
    expect(Object.keys(errors ?? {}).sort()).toEqual([
      "cliffMonths",
      "grantDate",
      "vsopsStrikePrice",
    ])
  })
})
