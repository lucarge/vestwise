// The ruler's scale for a valuation multiple: a log track, so 1x to 3x gets
// as much travel as 5x to 20x.

export const MULTIPLE_RANGE = { min: 0.5, max: 20 } as const
export const MULTIPLE_TICKS = [0.5, 1, 2, 3, 5, 10, 20]
export const DILUTION_TICKS = [0, 25, 50, 75]
export const MULTIPLE_STEPS = 1000

const SPAN = Math.log(MULTIPLE_RANGE.max / MULTIPLE_RANGE.min)

export function multipleFromPosition(position: number): number {
  const raw = MULTIPLE_RANGE.min * Math.exp((position / MULTIPLE_STEPS) * SPAN)
  return Math.round(raw * 10) / 10
}

export function positionFromMultiple(value: number): number {
  return Math.round(
    (Math.log(value / MULTIPLE_RANGE.min) / SPAN) * MULTIPLE_STEPS
  )
}

// One arrow press always moves to the next figure a person would say out
// loud; single track steps are too fine to change the rounded multiple
export function stepMultiple(value: number, direction: 1 | -1): number {
  const size = (v: number) => (v < 3 ? 0.1 : v < 10 ? 0.5 : 1)
  const step = direction === 1 ? size(value) : size(value - 0.01)
  const next = Math.round((value + direction * step) / step) * step
  const clamped = Math.min(
    MULTIPLE_RANGE.max,
    Math.max(MULTIPLE_RANGE.min, next)
  )
  return Math.round(clamped * 10) / 10
}
