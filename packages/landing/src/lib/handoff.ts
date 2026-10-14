// Hand-off to the app: edited terms travel to its Add Grant page in the URL
// fragment, which browsers never send to a server, and the app removes them
// from the address bar as soon as it has read them. The encoder is ported from
// packages/app/src/lib/grant-handoff.ts, whose tests pin the format: keep them
// in sync.

import { termsProblem, type GrantTerms } from "@/lib/vesting"

export const APP_URL = "https://app.vestwise.app"

const VERSION = 1

// The app's grant form takes euro amounts in cents
function cents(value: number): number {
  return Math.round(value * 100) / 100
}

function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("")
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function encodeGrantHandoff(t: GrantTerms): string {
  return toBase64Url(
    JSON.stringify({
      v: VERSION,
      shares: t.shares,
      valuePerShare: cents(t.valuePerShare),
      strike: cents(t.strike),
      schedule: t.schedule,
      periodMonths: t.periodMonths,
      cliffMonths: t.cliffMonths,
      start: formatDate(t.start),
    })
  )
}

// The app's Add Grant page with these terms filled in, or null when the app
// would turn them down: a problem the margin reports, or an amount that rounds
// to nothing in cents
export function buildHandoffUrl(t: GrantTerms): string | null {
  const inCents = { ...t, valuePerShare: cents(t.valuePerShare), strike: cents(t.strike) }
  if (termsProblem(inCents) || !(inCents.valuePerShare > 0)) return null
  return `${APP_URL}/grants/new#grant=${encodeGrantHandoff(inCents)}`
}
