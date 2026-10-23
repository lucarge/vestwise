// Centralized shape for what counts as a "backup" of user data. Both the
// download-file flow (settings.tsx) and the connected-file auto-sync read
// and write through these helpers, so the on-disk shape stays in one place.

export const BACKUP_VERSION = 3
export const DATA_CHANGED_EVENT = "vw-data-changed"

const KEYS = {
  grants: "vsop-grants",
  companies: "vsop-companies",
  columnConfig: "vsop-column-config",
  theme: "theme",
} as const

// Versions 1 and 2 kept one valuation history for every grant
const LEGACY_VALUATIONS_KEY = "vsop-valuations"

export const MIGRATED_COMPANY_ID = "migrated-company"
const MIGRATED_COMPANY_NAME = "Your company"

export const BACKUP_LOCAL_STORAGE_KEYS: ReadonlySet<string> = new Set(
  Object.values(KEYS),
)

export interface BackupData {
  version: number
  grants: unknown[]
  companies?: unknown[]
  /** Versions 1 and 2 only */
  valuations?: unknown[]
  columnConfig?: unknown[]
  theme?: string
}

export function isValidBackup(data: unknown): data is BackupData {
  if (typeof data !== "object" || data === null) return false
  const d = data as Record<string, unknown>
  if (!("grants" in d) || !Array.isArray(d.grants)) return false
  if (d.version === 1 || d.version === 2) return true
  return d.version === 3 && Array.isArray(d.companies)
}

// The stored shapes before version 3, as JSON holds them
interface StoredGrant {
  id: string
  grantDate: string
  grantedAmount: number
  vsopsValue: number
  vsopsStrikePrice: number
}

interface StoredValuation {
  id: string
  date: string
  /** Pre-money */
  valuation: number
  amountRaised?: number
}

function time(date: string): number {
  return new Date(date).getTime()
}

function priceOfGrant(grant: StoredGrant): number {
  return grant.grantedAmount > 0 ? grant.vsopsValue / grant.grantedAmount : 0
}

function postMoney(round: StoredValuation): number {
  return round.valuation + (round.amountRaised ?? 0)
}

// Price each saved valuation from one grant: the earliest grant made while
// the latest valuation that saw any grant was in effect. The others chain
// from it, assuming no shares were issued outside funding rounds: a round's
// price is its pre-money valuation over the shares the round before left.
function priceRounds(
  rounds: StoredValuation[],
  grants: StoredGrant[],
): (number | undefined)[] {
  for (let k = rounds.length - 1; k >= 0; k--) {
    const start = time(rounds[k].date)
    const end = k + 1 < rounds.length ? time(rounds[k + 1].date) : Infinity
    const anchor = grants.find((g) => {
      const t = time(g.grantDate)
      return t >= start && t < end && priceOfGrant(g) > 0
    })
    if (!anchor) continue

    const prices: number[] = []
    prices[k] = priceOfGrant(anchor)
    for (let i = k + 1; i < rounds.length; i++) {
      prices[i] = (prices[i - 1] * rounds[i].valuation) / postMoney(rounds[i - 1])
    }
    for (let i = k - 1; i >= 0; i--) {
      prices[i] = (prices[i + 1] * postMoney(rounds[i])) / rounds[i + 1].valuation
    }
    return prices
  }
  return rounds.map(() => undefined)
}

// One company for everything a version 1 or 2 backup held. The output
// depends on nothing but the input, so this browser and a connected file
// holding the same data upgrade to the same JSON.
function migratedCompany(grants: StoredGrant[], legacy: StoredValuation[]) {
  const byDate = [...grants].sort((a, b) => time(a.grantDate) - time(b.grantDate))
  const rounds = [...legacy].sort((a, b) => time(a.date) - time(b.date))
  const prices = priceRounds(rounds, byDate)

  const valuations: Record<string, unknown>[] = rounds.map((round, i) => ({
    id: round.id,
    date: round.date,
    valuation: postMoney(round),
    ...(prices[i] !== undefined ? { pricePerShare: prices[i] } : {}),
    ...(round.amountRaised ? { amountRaised: round.amountRaised } : {}),
  }))

  // A grant newer than every valuation and priced differently records its
  // price on the company, as it would when added today
  let latestTime = rounds.length > 0 ? time(rounds[rounds.length - 1].date) : -Infinity
  let latestPrice = prices[prices.length - 1]
  for (const grant of byDate) {
    const t = time(grant.grantDate)
    if (Number.isNaN(t) || t <= latestTime) continue
    const price = priceOfGrant(grant)
    if (latestPrice !== undefined && Math.abs(latestPrice - price) < 0.005) continue
    valuations.push({
      id: `migrated-${grant.id}`,
      date: grant.grantDate,
      pricePerShare: price,
      grantId: grant.id,
    })
    latestTime = t
    latestPrice = price
  }

  const latestGrant = byDate[byDate.length - 1]
  return {
    id: MIGRATED_COMPANY_ID,
    name: MIGRATED_COMPANY_NAME,
    ...(latestGrant ? { strikePrice: latestGrant.vsopsStrikePrice } : {}),
    valuations,
  }
}

/** A backup in the current shape: version 3 as it is, older ones upgraded */
export function upgradeBackup(data: BackupData): BackupData {
  if (data.version >= BACKUP_VERSION) return data

  const grants = data.grants as StoredGrant[]
  const legacy = (data.valuations ?? []) as StoredValuation[]
  const hasData = grants.length > 0 || legacy.length > 0

  // The keys in the order getDataSnapshot writes them
  const upgraded: BackupData = {
    version: BACKUP_VERSION,
    grants: grants.map((g) => ({ ...g, companyId: MIGRATED_COMPANY_ID })),
    companies: hasData ? [migratedCompany(grants, legacy)] : [],
  }
  if (data.columnConfig) upgraded.columnConfig = data.columnConfig
  if (data.theme) upgraded.theme = data.theme
  return upgraded
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

// Before anything reads it, data from before companies is upgraded once
export function migrateStoredData(): void {
  try {
    if (localStorage.getItem(KEYS.companies) !== null) return
    const grants = readJson<unknown[]>(KEYS.grants, [])
    const valuations = readJson<unknown[]>(LEGACY_VALUATIONS_KEY, [])
    if (grants.length === 0 && valuations.length === 0) return

    const upgraded = upgradeBackup({ version: 2, grants, valuations })
    localStorage.setItem(KEYS.grants, JSON.stringify(upgraded.grants))
    localStorage.setItem(KEYS.companies, JSON.stringify(upgraded.companies))
    localStorage.removeItem(LEGACY_VALUATIONS_KEY)
  } catch {
    // Without storage there is nothing to upgrade
  }
}

export function getDataSnapshot(): BackupData {
  const theme = localStorage.getItem(KEYS.theme)
  return {
    version: BACKUP_VERSION,
    grants: readJson<unknown[]>(KEYS.grants, []),
    companies: readJson<unknown[]>(KEYS.companies, []),
    columnConfig: readJson<unknown[]>(KEYS.columnConfig, []),
    theme: theme ?? undefined,
  }
}

export function serializeSnapshot(data: BackupData): string {
  return JSON.stringify(data, null, 2)
}

/**
 * Whether a connected file holds the same data as this browser. A file from
 * before companies is read as its upgrade, which is what this browser made
 * of the same data.
 */
export function fileMatchesSnapshot(
  fileContents: string,
  snapshot: string,
): boolean {
  if (fileContents === snapshot) return true
  try {
    const parsed: unknown = JSON.parse(fileContents)
    if (!isValidBackup(parsed) || parsed.version >= BACKUP_VERSION) return false
    return serializeSnapshot(upgradeBackup(parsed)) === snapshot
  } catch {
    return false
  }
}

export function applyDataSnapshot(backup: BackupData): void {
  const data = upgradeBackup(backup)
  localStorage.setItem(KEYS.grants, JSON.stringify(data.grants))
  localStorage.setItem(KEYS.companies, JSON.stringify(data.companies ?? []))
  localStorage.removeItem(LEGACY_VALUATIONS_KEY)
  if (data.columnConfig) {
    localStorage.setItem(KEYS.columnConfig, JSON.stringify(data.columnConfig))
  }
  if (data.theme) {
    localStorage.setItem(KEYS.theme, data.theme)
  }
}

export function dispatchDataChanged(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(DATA_CHANGED_EVENT))
}

export function subscribeToDataChanged(listener: () => void): () => void {
  window.addEventListener(DATA_CHANGED_EVENT, listener)
  return () => window.removeEventListener(DATA_CHANGED_EVENT, listener)
}
