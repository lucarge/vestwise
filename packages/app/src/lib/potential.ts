import type { Company } from "@/types/company"
import type { Grant } from "@/types/grant"
import { appreciationMultiplier } from "@/lib/company"

export interface PotentialScenario {
  multiplier: number
  netValue: number
  dilutedNetValue: number
}

export interface PotentialSummary {
  currentNetValue: number
  simulatedNetValue: number
  netGain: number
  dilutionImpact: number
}

/**
 * Compute per-grant appreciation multipliers from the company's prices.
 * Falls back to 1 (no appreciation) when the company has no price to compare.
 */
function getGrantMultipliers(grants: Grant[], company?: Company): number[] {
  return grants.map((g) => appreciationMultiplier(g, company) ?? 1)
}

/**
 * Compute net value of all grants at a given simulation multiplier.
 * The appreciation multiplier reflects value changes that have already
 * happened (from valuation history); the simulation multiplier represents
 * future growth on top of the current appreciated value.
 */
function computeNetValue(
  grants: Grant[],
  simulationMultiplier: number,
  appreciationMultipliers: number[],
): number {
  return grants.reduce((sum, grant, i) => {
    const basePrice = grant.vsopsValue / grant.grantedAmount
    const currentPrice = basePrice * appreciationMultipliers[i]
    const simulatedValue = grant.grantedAmount * currentPrice * simulationMultiplier
    const strikeCost = grant.grantedAmount * grant.vsopsStrikePrice
    return sum + Math.max(0, simulatedValue - strikeCost)
  }, 0)
}

export function computePotentialAtMultiplier(
  grants: Grant[],
  multiplier: number,
  dilutionPercent: number,
  company?: Company,
): PotentialSummary {
  const appreciationMultipliers = getGrantMultipliers(grants, company)
  const currentNetValue = computeNetValue(grants, 1, appreciationMultipliers)
  const netBeforeDilution = computeNetValue(grants, multiplier, appreciationMultipliers)
  const simulatedNetValue = netBeforeDilution * (1 - dilutionPercent / 100)
  return {
    currentNetValue,
    simulatedNetValue,
    netGain: simulatedNetValue - currentNetValue,
    dilutionImpact: netBeforeDilution - simulatedNetValue,
  }
}

export function computePotentialAtValuation(
  grants: Grant[],
  currentValuation: number,
  futureValuation: number,
  dilutionPercent: number,
  company?: Company,
): PotentialSummary {
  const multiplier = futureValuation / currentValuation
  return computePotentialAtMultiplier(grants, multiplier, dilutionPercent, company)
}

export function computePotentialCurve(
  grants: Grant[],
  dilutionPercent: number,
  company?: Company,
  steps = 20,
): PotentialScenario[] {
  const min = 0.5
  const max = 20
  const stepSize = (max - min) / steps
  const appreciationMultipliers = getGrantMultipliers(grants, company)

  const points: PotentialScenario[] = []
  for (let i = 0; i <= steps; i++) {
    const multiplier = Math.round((min + i * stepSize) * 10) / 10
    const netValue = computeNetValue(grants, multiplier, appreciationMultipliers)
    points.push({
      multiplier,
      netValue,
      dilutedNetValue: netValue * (1 - dilutionPercent / 100),
    })
  }
  return points
}
