import type { Company } from "@/types/company"
import type { Grant } from "@/types/grant"
import type { ValuationEntry } from "@/types/valuation"

export type GrantWithCompany = Grant & {
  /** Today's price per share over the grant's, once the company has a price */
  appreciation?: number
  /** The share of the company the grant stands for, in percent */
  ownership?: number
}

// Any two of an entry's figures give the third

export function priceOf(entry: ValuationEntry): number | undefined {
  if (entry.pricePerShare !== undefined) return entry.pricePerShare
  if (entry.valuation !== undefined && entry.shares) {
    return entry.valuation / entry.shares
  }
  return undefined
}

export function sharesOf(entry: ValuationEntry): number | undefined {
  if (entry.shares !== undefined) return entry.shares
  if (entry.valuation !== undefined && entry.pricePerShare) {
    return entry.valuation / entry.pricePerShare
  }
  return undefined
}

export function valuationOf(entry: ValuationEntry): number | undefined {
  if (entry.valuation !== undefined) return entry.valuation
  if (entry.shares !== undefined && entry.pricePerShare !== undefined) {
    return entry.shares * entry.pricePerShare
  }
  return undefined
}

// The latest entry that passes the test; of two on the same date, the one
// recorded later
function latestWhere(
  company: Company,
  test: (entry: ValuationEntry) => boolean
): ValuationEntry | undefined {
  let latest: ValuationEntry | undefined
  for (const entry of company.valuations) {
    if (test(entry) && (!latest || entry.date >= latest.date)) latest = entry
  }
  return latest
}

/** Oldest first */
export function sortedValuations(company: Company): ValuationEntry[] {
  return [...company.valuations].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )
}

export function latestValuation(company: Company): ValuationEntry | undefined {
  return latestWhere(company, () => true)
}

/** The valuation in effect on a date: the latest on or before it */
export function valuationAt(
  company: Company,
  date: Date
): ValuationEntry | undefined {
  return latestWhere(company, (entry) => entry.date <= date)
}

/** The latest entry a share can be priced from */
export function latestPriced(company: Company): ValuationEntry | undefined {
  return latestWhere(company, (entry) => priceOf(entry) !== undefined)
}

/** The latest entry that states a share count, or lets one be worked out */
export function latestCounted(company: Company): ValuationEntry | undefined {
  return latestWhere(company, (entry) => sharesOf(entry) !== undefined)
}

export function companyOf(
  grant: Grant,
  companies: Company[]
): Company | undefined {
  return companies.find((company) => company.id === grant.companyId)
}

/** The price per share a grant was made at: its own term */
export function grantPrice(grant: Grant): number {
  return grant.grantedAmount > 0 ? grant.vsopsValue / grant.grantedAmount : 0
}

/**
 * Today's price per share over the grant's. With no valuation since the
 * grant, the grant's own price is the latest known, so it holds at 1.
 */
export function appreciation(
  grant: Grant,
  company: Company | undefined
): number | undefined {
  const latest = company && latestPriced(company)
  const base = grantPrice(grant)
  if (!latest || base === 0) return undefined
  if (latest.date < grant.grantDate) return 1
  return priceOf(latest)! / base
}

/** The appreciation that changes a grant's value: none while the price holds */
export function appreciationMultiplier(
  grant: Grant,
  company: Company | undefined
): number | undefined {
  const multiplier = appreciation(grant, company)
  return multiplier === 1 ? undefined : multiplier
}

/** The grant's shares over the latest share count on record, in percent */
export function ownership(
  grant: Grant,
  company: Company | undefined
): number | undefined {
  const latest = company && latestCounted(company)
  const count = latest && sharesOf(latest)
  return count ? (grant.grantedAmount / count) * 100 : undefined
}

/**
 * Dilution from the company's funding rounds, in percent. Each round leaves
 * holders (valuation − raised) / valuation of what they held, on post-money
 * figures.
 */
export function cumulativeDilution(company: Company): number {
  let retained = 1
  for (const entry of company.valuations) {
    const post = valuationOf(entry)
    const raised = entry.amountRaised
    if (raised && raised > 0 && post && post > raised) {
      retained *= (post - raised) / post
    }
  }
  return (1 - retained) * 100
}

export function enrichGrants(
  grants: Grant[],
  companies: Company[]
): GrantWithCompany[] {
  return grants.map((grant) => {
    const company = companyOf(grant, companies)
    return {
      ...grant,
      appreciation: appreciation(grant, company),
      ownership: ownership(grant, company),
    }
  })
}

/** What one company's grants stand for together, when any share count is known */
export function totalOwnership(grants: GrantWithCompany[]): number | undefined {
  if (!grants.some((g) => g.ownership !== undefined)) return undefined
  return grants.reduce((sum, g) => sum + (g.ownership ?? 0), 0)
}

export function findCompany(
  companies: Company[],
  name: string
): Company | undefined {
  const wanted = name.trim()
  if (!wanted) return undefined
  return companies.find(
    (company) =>
      company.name
        .trim()
        .localeCompare(wanted, undefined, { sensitivity: "accent" }) === 0
  )
}

function samePrice(a: number | undefined, b: number): boolean {
  return a !== undefined && Math.abs(a - b) < 0.005
}

export interface GrantLink {
  grant: Grant
  /** The grant's company, when saving the grant adds or changes it */
  company?: Company
  /** What saving the grant does to its company, for the margin to say */
  change?: "creates" | "records" | "updates"
}

// Saving a grant. The clause names its company, which is found by name or
// made from the grant's own terms. A grant newer than every valuation on
// record and priced differently records its price on the company, and an
// entry recorded from a grant follows the grant's edits.
export function linkGrant(
  grant: Grant,
  companyName: string,
  companies: Company[],
  newId: () => string = () => crypto.randomUUID()
): GrantLink {
  const price = grantPrice(grant)
  const existing = findCompany(companies, companyName)

  if (!existing) {
    const company: Company = {
      id: newId(),
      name: companyName.trim(),
      strikePrice: grant.vsopsStrikePrice,
      valuations: [
        {
          id: newId(),
          date: grant.grantDate,
          pricePerShare: price,
          grantId: grant.id,
        },
      ],
    }
    return { grant: { ...grant, companyId: company.id }, company, change: "creates" }
  }

  const linked: Grant = { ...grant, companyId: existing.id }
  const recorded = existing.valuations.find((v) => v.grantId === grant.id)
  if (recorded) {
    if (
      recorded.date.getTime() === grant.grantDate.getTime() &&
      samePrice(recorded.pricePerShare, price)
    ) {
      return { grant: linked }
    }
    const valuations = existing.valuations.map((v) =>
      v === recorded ? { ...v, date: grant.grantDate, pricePerShare: price } : v
    )
    return {
      grant: linked,
      company: { ...existing, valuations },
      change: "updates",
    }
  }

  const latest = latestValuation(existing)
  const newer = !latest || grant.grantDate > latest.date
  if (!newer || (latest && samePrice(priceOf(latest), price))) {
    return { grant: linked }
  }
  const entry: ValuationEntry = {
    id: newId(),
    date: grant.grantDate,
    pricePerShare: price,
    grantId: grant.id,
  }
  return {
    grant: linked,
    company: { ...existing, valuations: [...existing.valuations, entry] },
    change: "records",
  }
}
