// The measures every exhibit shares. The drawn parts live in exhibit.tsx.

export const EXHIBIT_MARGIN = { top: 28, right: 12, left: 0, bottom: 0 }
export const EXHIBIT_ANIMATION = {
  animationDuration: 1100,
  animationEasing: "ease-in-out" as const,
}

/** Jan 1 of every year inside the range, as timestamps */
export function yearTicks(min: number, max: number): number[] {
  const ticks: number[] = []
  for (
    let year = new Date(min).getFullYear() + 1;
    year <= new Date(max).getFullYear();
    year++
  ) {
    const t = new Date(year, 0, 1).getTime()
    if (t > min && t < max) ticks.push(t)
  }
  return ticks
}

/** Where today falls across the x range, as a fraction from 0 to 1 */
export function todayFraction(now: number, min: number, max: number): number {
  if (max <= min) return now >= max ? 1 : 0
  return Math.min(1, Math.max(0, (now - min) / (max - min)))
}
