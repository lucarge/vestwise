import {
  computePotentialAtMultiplier,
  computePotentialAtValuation,
  computePotentialCurve,
} from "@/lib/potential"
import type { Company } from "@/types/company"
import type { Grant } from "@/types/grant"
import { useMemo, useState } from "react"

export type SimulationMode = "multiplier" | "valuation"

export function usePotential(
  grants: Grant[],
  currentValuation?: number,
  calculatedDilution?: number,
  company?: Company,
) {
  const [multiplier, setMultiplier] = useState(2)
  const [dilutionPercent, setDilutionPercent] = useState(
    calculatedDilution ? Math.round(calculatedDilution) : 0,
  )
  const [simulationMode, setSimulationMode] = useState<SimulationMode>("multiplier")
  const [futureValuation, setFutureValuation] = useState(
    currentValuation ? currentValuation * 2 : 0,
  )

  const effectiveMultiplier = useMemo(() => {
    if (simulationMode === "valuation" && currentValuation && currentValuation > 0) {
      return futureValuation / currentValuation
    }
    return multiplier
  }, [simulationMode, currentValuation, futureValuation, multiplier])

  const summary = useMemo(() => {
    if (simulationMode === "valuation" && currentValuation && currentValuation > 0) {
      return computePotentialAtValuation(grants, currentValuation, futureValuation, dilutionPercent, company)
    }
    return computePotentialAtMultiplier(grants, multiplier, dilutionPercent, company)
  }, [grants, multiplier, dilutionPercent, simulationMode, currentValuation, futureValuation, company])

  const curve = useMemo(
    () => computePotentialCurve(grants, dilutionPercent, company),
    [grants, dilutionPercent, company],
  )

  return {
    multiplier,
    setMultiplier,
    dilutionPercent,
    setDilutionPercent,
    simulationMode,
    setSimulationMode,
    futureValuation,
    setFutureValuation,
    effectiveMultiplier,
    summary,
    curve,
  }
}
