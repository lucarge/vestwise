// The schedule is drawn as an annex to the agreement, not a dashboard chart:
// vested shares in solid ink, shares still to come as a 7% wash under an ink
// step line, dashed verticals for the cliff and the fully vested date, and a
// yellow flag where today is. These parts give every Recharts exhibit the
// same materials; the shared measures live in exhibit-scale.ts.

interface LabelViewBox {
  x?: number
  y?: number
  width?: number
  height?: number
}

interface ExhibitLabelProps {
  viewBox?: LabelViewBox
  title: string
  detail?: string
  anchor?: "start" | "end"
}

/** A marker's label above the plot: a bold title and a soft detail */
export function ExhibitLabel({
  viewBox,
  title,
  detail,
  anchor = "start",
}: ExhibitLabelProps) {
  const x = (viewBox?.x ?? 0) + (anchor === "end" ? -6 : 6)
  const y = (viewBox?.y ?? 0) - 8
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={11}>
      <tspan fontWeight={700} fill="var(--ink)">
        {title}
      </tspan>
      {detail && <tspan fill="var(--ink-soft)">{` ${detail}`}</tspan>}
    </text>
  )
}

interface ExhibitFlagProps {
  viewBox?: LabelViewBox
  text?: string
  anchor?: "start" | "end"
}

/** The yellow tag at the top of a highlighter bar */
export function ExhibitFlag({
  viewBox,
  text = "Today",
  anchor = "start",
}: ExhibitFlagProps) {
  const x0 = viewBox?.x ?? 0
  const y0 = viewBox?.y ?? 0
  const width = Math.round(text.length * 6.6 + 16)
  const x = anchor === "end" ? x0 - width + 2 : x0 - 2
  return (
    <g>
      <rect x={x} y={y0} width={width} height={20} fill="var(--mark)" />
      <text
        x={x + 8}
        y={y0 + 14}
        fontSize={11}
        fontWeight={700}
        fill="var(--mark-ink)"
      >
        {text}
      </text>
    </g>
  )
}

/** A hard-stop gradient: solid ink before the split, a 7% wash after */
export function PastFutureFill({ id, at }: { id: string; at: number }) {
  const offset = `${at * 100}%`
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
      <stop offset={offset} stopColor="var(--ink)" stopOpacity={1} />
      <stop offset={offset} stopColor="var(--ink)" stopOpacity={0.07} />
    </linearGradient>
  )
}

/** The matching outline: none over the solid past, 1.5px ink over the future */
export function PastFutureStroke({ id, at }: { id: string; at: number }) {
  const offset = `${at * 100}%`
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
      <stop offset={offset} stopColor="var(--ink)" stopOpacity={0} />
      <stop offset={offset} stopColor="var(--ink)" stopOpacity={1} />
    </linearGradient>
  )
}
