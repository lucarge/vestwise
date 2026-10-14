/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import {
  addMonths,
  payout,
  startOfMonth,
  summarize,
  termsProblem,
  vestingEvents,
  yearlySummary,
  type GrantTerms,
} from "@/lib/vesting"

// The sample agreement. Dates are relative to today so "today" never goes
// stale: the hire grant started 27 months ago, the refresh grant 9 months ago.
const TODAY = new Date()
const THIS_MONTH = startOfMonth(TODAY)

export const SAMPLE_GRANT: GrantTerms = {
  shares: 10_000,
  valuePerShare: 4,
  strike: 1,
  schedule: "monthly",
  periodMonths: 48,
  cliffMonths: 12,
  start: addMonths(THIS_MONTH, -27),
}

export const REFRESH_GRANT: GrantTerms = {
  shares: 5_000,
  valuePerShare: 6,
  strike: 1,
  schedule: "monthly",
  periodMonths: 48,
  cliffMonths: 12,
  start: addMonths(THIS_MONTH, -9),
}

export const MULTIPLE_RANGE = { min: 0.5, max: 20 } as const

function sameTerms(a: GrantTerms, b: GrantTerms): boolean {
  return (
    a.shares === b.shares &&
    a.valuePerShare === b.valuePerShare &&
    a.strike === b.strike &&
    a.schedule === b.schedule &&
    a.periodMonths === b.periodMonths &&
    a.cliffMonths === b.cliffMonths &&
    a.start.getTime() === b.start.getTime()
  )
}

function useAgreementState() {
  const [grant, setGrantState] = useState<GrantTerms>(SAMPLE_GRANT)
  const [withRefresh, setWithRefresh] = useState(false)
  const [multiple, setMultiple] = useState(3)
  const [dilution, setDilution] = useState(20)

  const derived = useMemo(() => {
    const problem = termsProblem(grant)
    const events = problem ? [] : vestingEvents(grant)
    const summary = summarize(grant, events, TODAY)

    const refreshEvents = vestingEvents(REFRESH_GRANT)
    const refreshSummary = summarize(REFRESH_GRANT, refreshEvents, TODAY)

    const held = withRefresh
      ? [
          { terms: grant, events },
          { terms: REFRESH_GRANT, events: refreshEvents },
        ]
      : [{ terms: grant, events }]

    return {
      problem,
      events,
      summary,
      refreshEvents,
      refreshSummary,
      years: yearlySummary(held),
      exit: payout(
        held.map((h) => h.terms),
        multiple,
        dilution,
      ),
      totalShares: held.reduce((sum, h) => sum + h.terms.shares, 0),
      isSample: sameTerms(grant, SAMPLE_GRANT),
    }
  }, [grant, withRefresh, multiple, dilution])

  return {
    today: TODAY,
    grant,
    setGrant: (patch: Partial<GrantTerms>) => setGrantState((g) => ({ ...g, ...patch })),
    resetGrant: () => setGrantState(SAMPLE_GRANT),
    withRefresh,
    setWithRefresh,
    multiple,
    setMultiple,
    dilution,
    setDilution,
    ...derived,
  }
}

type Agreement = ReturnType<typeof useAgreementState>

const AgreementContext = createContext<Agreement | null>(null)

// One set of terms for the whole document: whatever the visitor types into
// the grant clause is carried through every later clause.
export function AgreementProvider({ children }: { children: ReactNode }) {
  const agreement = useAgreementState()
  return <AgreementContext.Provider value={agreement}>{children}</AgreementContext.Provider>
}

export function useAgreement(): Agreement {
  const agreement = useContext(AgreementContext)
  if (!agreement) throw new Error("useAgreement must be used inside AgreementProvider")
  return agreement
}
