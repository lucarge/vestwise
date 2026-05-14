import { useEffect, useMemo, useState } from "react"

import { dispatchDataChanged } from "@/lib/backup-data"
import type { Grant } from "@/types/grant"

export interface GrantTotals {
  totalGrantedAmount: number
  totalVsopsValue: number
  totalStrikeCost: number
}

const STORAGE_KEY = "vsop-grants"

function loadGrants(): Grant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw, (key, value) =>
      key === "grantDate" ? new Date(value) : value,
    )
  } catch {
    return []
  }
}

export function useGrants() {
  const [grants, setGrants] = useState<Grant[]>(() => loadGrants())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(grants))
    dispatchDataChanged()
  }, [grants])

  const addGrant = (grant: Grant) => {
    setGrants((prev) => [...prev, grant])
  }

  const updateGrant = (grant: Grant) => {
    setGrants((prev) => prev.map((g) => (g.id === grant.id ? grant : g)))
  }

  const removeGrant = (id: string) => {
    setGrants((prev) => prev.filter((g) => g.id !== id))
  }

  const totals: GrantTotals = useMemo(
    () => ({
      totalGrantedAmount: grants.reduce((sum, g) => sum + g.grantedAmount, 0),
      totalVsopsValue: grants.reduce((sum, g) => sum + g.vsopsValue, 0),
      totalStrikeCost: grants.reduce(
        (sum, g) => sum + g.vsopsStrikePrice * g.grantedAmount,
        0,
      ),
    }),
    [grants],
  )

  return { grants, addGrant, updateGrant, removeGrant, totals }
}
