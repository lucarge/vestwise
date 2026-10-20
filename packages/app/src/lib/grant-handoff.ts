import { validateGrantForm } from "@/lib/grant-validation"
import type { GrantFormData, GrantPrefill, VestingSchedule } from "@/types/grant"

// Grant links: the landing page sends a visitor's terms to the Add Grant page
// in the URL fragment, /grants/new#grant=<encoded>. Browsers never send the
// fragment to a server, and the app removes it from the address bar at
// startup, before the router or analytics can read it.
//
// <encoded> is base64url (unpadded) UTF-8 JSON, version 1:
//   {"v":1,"shares":10000,"valuePerShare":4,"strike":1,"schedule":"monthly",
//    "periodMonths":48,"cliffMonths":12,"start":"2024-07-01"}
// Amounts are euros per share, in cents like the form's inputs; start is the
// grant date. packages/landing/src/lib/handoff.ts ports encodeGrantHandoff:
// keep the two in sync.

const VERSION = 1
const PARAM = "grant"
const ADD_GRANT_PATH = "/grants/new"
const MAX_ENCODED_LENGTH = 1024
const SCHEDULES: readonly string[] = ["monthly", "quarterly", "yearly"]

export interface GrantHandoffTerms {
  shares: number
  valuePerShare: number
  strike: number
  schedule: VestingSchedule
  periodMonths: number
  cliffMonths: number
  start: Date
}

export type GrantHandoff =
  | { status: "ready"; prefill: GrantPrefill }
  | { status: "invalid" }

function cents(value: number): number {
  return Math.round(value * 100) / 100
}

function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const [year, month, day] = match.slice(1).map(Number)
  const date = new Date(year, month - 1, day)
  // Date rolls 2024-02-30 into March and two-digit years into the 1900s
  const exact =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  return exact ? date : null
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("")
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(encoded: string): string {
  const binary = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"))
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function isInteger(value: unknown): value is number {
  return Number.isInteger(value)
}

function isSchedule(value: unknown): value is VestingSchedule {
  return typeof value === "string" && SCHEDULES.includes(value)
}

export function encodeGrantHandoff(terms: GrantHandoffTerms): string {
  return toBase64Url(
    JSON.stringify({
      v: VERSION,
      shares: terms.shares,
      valuePerShare: cents(terms.valuePerShare),
      strike: cents(terms.strike),
      schedule: terms.schedule,
      periodMonths: terms.periodMonths,
      cliffMonths: terms.cliffMonths,
      start: formatDate(terms.start),
    }),
  )
}

function parseTerms(encoded: string): GrantHandoffTerms | null {
  if (encoded.length > MAX_ENCODED_LENGTH || !/^[A-Za-z0-9_-]+$/.test(encoded)) {
    return null
  }

  let data: unknown
  try {
    data = JSON.parse(fromBase64Url(encoded))
  } catch {
    return null
  }
  if (typeof data !== "object" || data === null) return null

  const p = data as Record<string, unknown>
  const start = parseDate(p.start)
  if (
    p.v !== VERSION ||
    !isFiniteNumber(p.shares) ||
    !isFiniteNumber(p.valuePerShare) ||
    !isFiniteNumber(p.strike) ||
    !isSchedule(p.schedule) ||
    !isInteger(p.periodMonths) ||
    !isInteger(p.cliffMonths) ||
    !start
  ) {
    return null
  }

  return {
    shares: p.shares,
    valuePerShare: p.valuePerShare,
    strike: p.strike,
    schedule: p.schedule,
    periodMonths: p.periodMonths,
    cliffMonths: p.cliffMonths,
    start,
  }
}

/** The Add Grant form's starting values, or null unless the form would accept them */
export function decodeGrantHandoff(encoded: string): GrantPrefill | null {
  const terms = parseTerms(encoded)
  if (!terms) return null

  const form: GrantFormData = {
    grantDate: terms.start,
    vestingSchedule: terms.schedule,
    vestingPeriodMonths: String(terms.periodMonths),
    cliffMonths: String(terms.cliffMonths),
    grantedAmount: String(terms.shares),
    vsopsValue: String(cents(terms.valuePerShare)),
    vsopsStrikePrice: String(cents(terms.strike)),
  }
  return validateGrantForm(form) ? null : { form, valueMode: "per-share" }
}

/** The parts of window that reading a grant link touches */
export interface HandoffWindow {
  location: Pick<Location, "hash" | "search">
  history: Pick<History, "state" | "replaceState">
}

// Held in memory only, until the Add Grant page has shown it
let captured: GrantHandoff | null = null

// Call once before the first render. A grant link is read, then the address
// becomes the Add Grant page without the fragment; the router keeps its
// history state and never sees the old address.
export function captureGrantHandoff(win: HandoffWindow = window): void {
  const { hash, search } = win.location
  const encoded = new URLSearchParams(hash.slice(1)).get(PARAM)
  if (encoded === null) return

  win.history.replaceState(win.history.state, "", ADD_GRANT_PATH + search)
  const prefill = decodeGrantHandoff(encoded)
  captured = prefill ? { status: "ready", prefill } : { status: "invalid" }
}

export function peekGrantHandoff(): GrantHandoff | null {
  return captured
}

export function clearGrantHandoff(): void {
  captured = null
}
