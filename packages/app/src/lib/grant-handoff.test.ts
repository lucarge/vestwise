import { afterEach, describe, expect, it, vi } from "vitest"
import {
  captureGrantHandoff,
  clearGrantHandoff,
  decodeGrantHandoff,
  encodeGrantHandoff,
  peekGrantHandoff,
  type GrantHandoffTerms,
  type HandoffWindow,
} from "./grant-handoff"

// The landing page's sample terms
function makeTerms(overrides: Partial<GrantHandoffTerms> = {}): GrantHandoffTerms {
  return {
    shares: 10_000,
    valuePerShare: 4,
    strike: 1,
    schedule: "monthly",
    periodMonths: 48,
    cliffMonths: 12,
    start: new Date(2024, 6, 1), // July 1, 2024
    ...overrides,
  }
}

// base64url of any JSON text, for payloads the encoder would never produce
function encodeRaw(json: string): string {
  return btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function payload(overrides: Record<string, unknown> = {}): string {
  return encodeRaw(
    JSON.stringify({
      v: 1,
      shares: 10000,
      valuePerShare: 4,
      strike: 1,
      schedule: "monthly",
      periodMonths: 48,
      cliffMonths: 12,
      start: "2024-07-01",
      ...overrides,
    }),
  )
}

describe("encodeGrantHandoff and decodeGrantHandoff", () => {
  it("turns terms into Add Grant form values, with the value per share", () => {
    expect(decodeGrantHandoff(encodeGrantHandoff(makeTerms()))).toEqual({
      form: {
        grantDate: new Date(2024, 6, 1),
        vestingSchedule: "monthly",
        vestingPeriodMonths: "48",
        cliffMonths: "12",
        grantedAmount: "10000",
        vsopsValue: "4",
        vsopsStrikePrice: "1",
      },
      valueMode: "per-share",
    })
  })

  it("pins the version 1 format that the landing page ports", () => {
    const encoded = encodeGrantHandoff(makeTerms())

    expect(encoded).toBe(
      "eyJ2IjoxLCJzaGFyZXMiOjEwMDAwLCJ2YWx1ZVBlclNoYXJlIjo0LCJzdHJpa2UiOjEsInNjaGVkdWxlIjoibW9udGhseSIsInBlcmlvZE1vbnRocyI6NDgsImNsaWZmTW9udGhzIjoxMiwic3RhcnQiOiIyMDI0LTA3LTAxIn0",
    )
    expect(atob(encoded)).toBe(
      '{"v":1,"shares":10000,"valuePerShare":4,"strike":1,"schedule":"monthly","periodMonths":48,"cliffMonths":12,"start":"2024-07-01"}',
    )
  })

  it("keeps fractional shares, other schedules and no cliff", () => {
    const prefill = decodeGrantHandoff(
      encodeGrantHandoff(
        makeTerms({ shares: 1250.5, schedule: "quarterly", cliffMonths: 0 }),
      ),
    )

    expect(prefill?.form).toMatchObject({
      grantedAmount: "1250.5",
      vestingSchedule: "quarterly",
      cliffMonths: "0",
    })
  })

  it("rounds amounts to cents, the precision the form's inputs take", () => {
    const encoded = encodeGrantHandoff(
      makeTerms({ valuePerShare: 4.125, strike: 0.1 + 0.2 }),
    )

    expect(atob(encoded)).toContain('"valuePerShare":4.13,"strike":0.3,')
    expect(decodeGrantHandoff(payload({ valuePerShare: 16.875 }))?.form).toMatchObject(
      { vsopsValue: "16.88" },
    )
  })

  it("ignores fields it doesn't know and reads the URL-safe alphabet", () => {
    // "?~" encodes to "/" and "+" in standard base64, so "_" and "-" here
    const encoded = payload({ note: "?~?~" })
    expect(encoded).toMatch(/[-_]/)

    expect(decodeGrantHandoff(encoded)?.form.grantedAmount).toBe("10000")
  })
})

describe("decodeGrantHandoff rejects", () => {
  it.each([
    ["an empty value", ""],
    ["characters outside base64url", "eyJ2IjoxfQ=="],
    ["a truncated value", "a"],
    // btoa writes "\xff" as the lone byte 0xFF, which is never valid UTF-8
    ["bytes that aren't UTF-8", payload({ note: "\xff" })],
    ["text that isn't JSON", encodeRaw("grant")],
    ["JSON null", encodeRaw("null")],
    ["a JSON array", encodeRaw("[1]")],
    ["a JSON number", encodeRaw("42")],
    ["an oversized value", "A".repeat(2000)],
  ])("%s", (_, encoded) => {
    expect(decodeGrantHandoff(encoded)).toBeNull()
  })

  it.each([
    ["no version", { v: undefined }],
    ["a newer version", { v: 2 }],
    ["a version string", { v: "1" }],
    ["missing shares", { shares: undefined }],
    ["shares as a string", { shares: "10000" }],
    ["a null value", { valuePerShare: null }],
    ["a boolean strike", { strike: true }],
    ["an unknown schedule", { schedule: "weekly" }],
    ["a fractional vesting period", { periodMonths: 12.5 }],
    ["a cliff as a string", { cliffMonths: "12" }],
    ["a timestamp start", { start: 1719792000000 }],
    ["an unpadded date", { start: "2024-7-1" }],
    ["a day that doesn't exist", { start: "2024-02-30" }],
    ["a month that doesn't exist", { start: "2024-13-01" }],
    ["a two-digit year", { start: "0099-01-01" }],
  ])("%s", (_, overrides) => {
    expect(decodeGrantHandoff(payload(overrides))).toBeNull()
  })

  it("numbers too large for JSON to hold", () => {
    const json = atob(payload()).replace('"shares":10000', '"shares":1e400')
    expect(decodeGrantHandoff(encodeRaw(json))).toBeNull()
  })

  it.each([
    ["no shares", { shares: 0 }],
    ["negative shares", { shares: -10 }],
    ["a zero value", { valuePerShare: 0 }],
    ["a zero strike", { strike: 0 }],
    ["a strike that rounds to zero", { strike: 0.004 }],
    ["no vesting period", { periodMonths: 0 }],
    ["a negative cliff", { cliffMonths: -1 }],
    ["a cliff as long as the vesting period", { cliffMonths: 48 }],
    ["a cliff longer than the vesting period", { cliffMonths: 60 }],
  ])("terms the grant form refuses: %s", (_, overrides) => {
    expect(decodeGrantHandoff(payload(overrides))).toBeNull()
  })
})

describe("captureGrantHandoff", () => {
  const routerState = { usr: null, key: "default", idx: 0 }

  function fakeWindow(hash: string, search = "") {
    const replaceState = vi.fn()
    const win: HandoffWindow = {
      location: { hash, search },
      history: { state: routerState, replaceState },
    }
    return { win, replaceState }
  }

  afterEach(clearGrantHandoff)

  it("takes a grant link out of the address and opens Add Grant", () => {
    const encoded = encodeGrantHandoff(makeTerms())
    const { win, replaceState } = fakeWindow(`#grant=${encoded}`, "?ref=landing")

    captureGrantHandoff(win)

    expect(replaceState).toHaveBeenCalledExactlyOnceWith(
      routerState,
      "",
      "/grants/new?ref=landing",
    )
    expect(peekGrantHandoff()).toEqual({
      status: "ready",
      prefill: decodeGrantHandoff(encoded),
    })
  })

  it("takes a broken link out of the address too, and reports it", () => {
    const { win, replaceState } = fakeWindow(`#grant=${payload({ strike: 0 })}`)

    captureGrantHandoff(win)

    expect(replaceState).toHaveBeenCalledOnce()
    expect(peekGrantHandoff()).toEqual({ status: "invalid" })
  })

  it.each(["", "#section", "#grants=abc"])(
    "leaves an address with %j alone",
    (hash) => {
      const { win, replaceState } = fakeWindow(hash)

      captureGrantHandoff(win)

      expect(replaceState).not.toHaveBeenCalled()
      expect(peekGrantHandoff()).toBeNull()
    },
  )

  it("holds the link until the Add Grant page clears it", () => {
    captureGrantHandoff(fakeWindow(`#grant=${payload()}`).win)
    expect(peekGrantHandoff()?.status).toBe("ready")
    expect(peekGrantHandoff()?.status).toBe("ready")

    clearGrantHandoff()
    expect(peekGrantHandoff()).toBeNull()
  })
})
