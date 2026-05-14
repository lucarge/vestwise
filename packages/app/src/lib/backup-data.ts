// Centralized shape for what counts as a "backup" of user data. Both the
// download-file flow (settings.tsx) and the connected-file auto-sync read
// and write through these helpers, so the on-disk shape stays in one place.

export const BACKUP_VERSION = 2
export const DATA_CHANGED_EVENT = "vw-data-changed"

const KEYS = {
  grants: "vsop-grants",
  valuations: "vsop-valuations",
  columnConfig: "vsop-column-config",
  theme: "theme",
} as const

export const BACKUP_LOCAL_STORAGE_KEYS: ReadonlySet<string> = new Set(
  Object.values(KEYS),
)

export interface BackupData {
  version: number
  grants: unknown[]
  valuations?: unknown[]
  columnConfig?: unknown[]
  theme?: string
}

export function isValidBackup(data: unknown): data is BackupData {
  if (typeof data !== "object" || data === null) return false
  const d = data as Record<string, unknown>
  return (
    (d.version === 1 || d.version === 2) &&
    "grants" in d &&
    Array.isArray(d.grants)
  )
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

export function getDataSnapshot(): BackupData {
  const theme = localStorage.getItem(KEYS.theme)
  return {
    version: BACKUP_VERSION,
    grants: readJson<unknown[]>(KEYS.grants, []),
    valuations: readJson<unknown[]>(KEYS.valuations, []),
    columnConfig: readJson<unknown[]>(KEYS.columnConfig, []),
    theme: theme ?? undefined,
  }
}

export function serializeSnapshot(data: BackupData): string {
  return JSON.stringify(data, null, 2)
}

export function applyDataSnapshot(backup: BackupData): void {
  localStorage.setItem(KEYS.grants, JSON.stringify(backup.grants))
  if (backup.valuations) {
    localStorage.setItem(KEYS.valuations, JSON.stringify(backup.valuations))
  }
  if (backup.columnConfig) {
    localStorage.setItem(KEYS.columnConfig, JSON.stringify(backup.columnConfig))
  }
  if (backup.theme) {
    localStorage.setItem(KEYS.theme, backup.theme)
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
