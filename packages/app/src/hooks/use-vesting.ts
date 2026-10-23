import { useMemo } from "react"
import type { Company } from "@/types/company"
import type { Grant } from "@/types/grant"
import {
  computeGrantTimeline,
  computeCumulativeTimeline,
  computeYearlySummary,
} from "@/lib/vesting"

export function useVesting(grants: Grant[], companies?: Company[]) {
  const grantTimelines = useMemo(
    () => grants.map(computeGrantTimeline),
    [grants],
  )

  const cumulativeTimeline = useMemo(
    () => computeCumulativeTimeline(grants, companies),
    [grants, companies],
  )

  const yearlySummary = useMemo(
    () => computeYearlySummary(grants),
    [grants],
  )

  return { grantTimelines, cumulativeTimeline, yearlySummary }
}
