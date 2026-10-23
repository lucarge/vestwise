import { useEffect, useState } from "react"

import { dispatchDataChanged } from "@/lib/backup-data"
import type { Company } from "@/types/company"
import type { ValuationEntry } from "@/types/valuation"

const STORAGE_KEY = "vsop-companies"

function loadCompanies(): Company[] {
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

// One instance per page: the page passes companies and these changes down,
// so a dialog and the table beside it stay in step
export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>(() => loadCompanies())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companies))
    dispatchDataChanged()
  }, [companies])

  /** Adds the company, or replaces the one with its id */
  const saveCompany = (company: Company) => {
    setCompanies((prev) =>
      prev.some((c) => c.id === company.id)
        ? prev.map((c) => (c.id === company.id ? company : c))
        : [...prev, company],
    )
  }

  const removeCompany = (id: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id))
  }

  const changeValuations = (
    companyId: string,
    change: (valuations: ValuationEntry[]) => ValuationEntry[],
  ) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === companyId ? { ...c, valuations: change(c.valuations) } : c,
      ),
    )
  }

  const addValuation = (companyId: string, entry: ValuationEntry) => {
    changeValuations(companyId, (valuations) => [...valuations, entry])
  }

  const updateValuation = (companyId: string, entry: ValuationEntry) => {
    changeValuations(companyId, (valuations) =>
      valuations.map((v) => (v.id === entry.id ? entry : v)),
    )
  }

  const removeValuation = (companyId: string, id: string) => {
    changeValuations(companyId, (valuations) =>
      valuations.filter((v) => v.id !== id),
    )
  }

  // A price recorded from a grant stays when the grant goes or moves to
  // another company, as a figure of its own
  const detachGrant = (grantId: string) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.valuations.some((v) => v.grantId === grantId)
          ? {
              ...c,
              valuations: c.valuations.map((v) =>
                v.grantId === grantId ? { ...v, grantId: undefined } : v,
              ),
            }
          : c,
      ),
    )
  }

  return {
    companies,
    saveCompany,
    removeCompany,
    addValuation,
    updateValuation,
    removeValuation,
    detachGrant,
  }
}
