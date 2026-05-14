import { useCallback, useEffect, useMemo, useState } from "react"

import { dispatchDataChanged } from "@/lib/backup-data"
import {
  COLUMN_DEFS,
  DEFAULT_COLUMN_CONFIG,
  type ColumnConfig,
  type ColumnDef,
  type ColumnId,
} from "@/lib/columns"
import type { GrantWithValuation } from "@/lib/valuation"

const STORAGE_KEY = "vsop-column-config"
const SORT_STORAGE_KEY = "vsop-sort-config"

const ALL_COLUMN_IDS = new Set(Object.keys(COLUMN_DEFS) as ColumnId[])

export interface SortConfig {
  column: ColumnId | null
  direction: "asc" | "desc"
}

function loadConfig(): ColumnConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_COLUMN_CONFIG

    const stored: ColumnConfig[] = JSON.parse(raw)
    // Remove stale IDs
    const valid = stored.filter((c) => ALL_COLUMN_IDS.has(c.id))
    // Append any new IDs not in stored config
    const storedIds = new Set(valid.map((c) => c.id))
    for (const id of ALL_COLUMN_IDS) {
      if (!storedIds.has(id)) {
        valid.push({ id, visible: true })
      }
    }
    return valid
  } catch {
    return DEFAULT_COLUMN_CONFIG
  }
}

function loadSortConfig(): SortConfig {
  try {
    const raw = localStorage.getItem(SORT_STORAGE_KEY)
    if (!raw) return { column: null, direction: "asc" }
    const stored: SortConfig = JSON.parse(raw)
    if (stored.column && !ALL_COLUMN_IDS.has(stored.column)) {
      return { column: null, direction: "asc" }
    }
    return stored
  } catch {
    return { column: null, direction: "asc" }
  }
}

export function useColumnConfig() {
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(loadConfig)
  const [sortConfig, setSortConfig] = useState<SortConfig>(loadSortConfig)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columnConfig))
    dispatchDataChanged()
  }, [columnConfig])

  useEffect(() => {
    localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sortConfig))
  }, [sortConfig])

  const visibleColumns: ColumnDef[] = useMemo(
    () =>
      columnConfig
        .filter((c) => c.visible)
        .map((c) => COLUMN_DEFS[c.id]),
    [columnConfig],
  )

  const toggleColumn = (id: ColumnId) => {
    setColumnConfig((prev) => {
      const visibleCount = prev.filter((c) => c.visible).length
      const target = prev.find((c) => c.id === id)
      // Prevent hiding the last visible column
      if (target?.visible && visibleCount <= 1) return prev
      return prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c))
    })
  }

  const moveColumn = (id: ColumnId, direction: "up" | "down") => {
    setColumnConfig((prev) => {
      const idx = prev.findIndex((c) => c.id === id)
      const swapIdx = direction === "up" ? idx - 1 : idx + 1
      if (idx < 0 || swapIdx < 0 || swapIdx >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return next
    })
  }

  const resetToDefaults = () => {
    setColumnConfig(DEFAULT_COLUMN_CONFIG)
  }

  const toggleSort = useCallback((id: ColumnId) => {
    setSortConfig((prev) => {
      if (prev.column !== id) return { column: id, direction: "asc" }
      if (prev.direction === "asc") return { column: id, direction: "desc" }
      return { column: null, direction: "asc" }
    })
  }, [])

  const sortGrants = useCallback(
    (grants: GrantWithValuation[]): GrantWithValuation[] => {
      if (!sortConfig.column) return grants
      const colDef = COLUMN_DEFS[sortConfig.column]
      if (!colDef.sortValue) return grants
      const { sortValue } = colDef
      const dir = sortConfig.direction === "asc" ? 1 : -1
      return [...grants].sort((a, b) => {
        const va = sortValue(a)
        const vb = sortValue(b)
        if (va < vb) return -1 * dir
        if (va > vb) return 1 * dir
        return 0
      })
    },
    [sortConfig],
  )

  return {
    columnConfig,
    visibleColumns,
    toggleColumn,
    moveColumn,
    resetToDefaults,
    sortConfig,
    toggleSort,
    sortGrants,
  }
}
