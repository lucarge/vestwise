// Numbers follow the visitor's own locale (a German visitor reads 16.875 €,
// an Irish one €16,875); month names stay English to match the page's copy.

function visitorLocale(): string {
  try {
    const locale = navigator.languages?.[0] ?? navigator.language
    if (locale) {
      new Intl.NumberFormat(locale)
      return locale
    }
  } catch {
    // Fall through to the default
  }
  return "en-IE"
}

export const LOCALE = visitorLocale()

const euroWhole = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
})

const euroCents = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const whole = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 })

const upToTwo = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 })

const cents = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const oneDecimal = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const monthYear = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" })
const shortMonthYear = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" })

export function euro(value: number): string {
  return euroWhole.format(Math.round(value))
}

export function euroPrecise(value: number): string {
  return euroCents.format(value)
}

export function shares(value: number): string {
  return Number.isInteger(value) ? whole.format(value) : upToTwo.format(value)
}

export function amount(value: number): string {
  return cents.format(value)
}

export function multiple(value: number): string {
  return `${oneDecimal.format(value)}×`
}

export function percent(value: number): string {
  return `${whole.format(value)}%`
}

export function month(date: Date): string {
  return monthYear.format(date)
}

export function shortMonth(date: Date): string {
  return shortMonthYear.format(date)
}

// Accepts either convention: "10,000", "10.000", "4.50", "4,50", "1 250,75".
// A separator followed by exactly three digits groups thousands (unless the
// part before it is zero, as in "0,125"); otherwise it marks the decimals.
export function parseAmount(raw: string): number | null {
  const compact = raw.replace(/[\s\u00a0\u202f'\u2019\u20ac]/g, "").replace(/^eur/i, "")
  if (compact === "" || !/^\d[\d.,]*$/.test(compact)) return null

  const lastSep = Math.max(compact.lastIndexOf("."), compact.lastIndexOf(","))
  if (lastSep === -1) return Number(compact)

  const head = compact.slice(0, lastSep).replace(/[.,]/g, "")
  const tail = compact.slice(lastSep + 1)
  if (tail === "") return Number(head)

  const thousands = tail.length === 3 && head !== "" && Number(head) !== 0
  const value = thousands ? Number(head + tail) : Number(`${head}.${tail}`)
  return Number.isFinite(value) ? value : null
}
