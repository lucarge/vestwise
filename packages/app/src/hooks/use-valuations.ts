import { useEffect, useState } from "react"

import { dispatchDataChanged } from "@/lib/backup-data"
import type { ValuationEntry } from "@/types/valuation"

const STORAGE_KEY = "vsop-valuations"

function loadValuations(): ValuationEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw, (key, value) =>
      key === "date" ? new Date(value) : value,
    )
  } catch {
    return []
  }
}

export function useValuations() {
  const [valuations, setValuations] = useState<ValuationEntry[]>(
    () => loadValuations(),
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(valuations))
    dispatchDataChanged()
  }, [valuations])

  const addValuation = (entry: ValuationEntry) => {
    setValuations((prev) => [...prev, entry])
  }

  const updateValuation = (entry: ValuationEntry) => {
    setValuations((prev) =>
      prev.map((v) => (v.id === entry.id ? entry : v)),
    )
  }

  const removeValuation = (id: string) => {
    setValuations((prev) => prev.filter((v) => v.id !== id))
  }

  return { valuations, addValuation, updateValuation, removeValuation }
}
