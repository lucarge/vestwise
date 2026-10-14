import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react"
import { Check } from "lucide-react"
import { useElementWidth } from "@/hooks/use-element-width"
import { prefersReducedMotion } from "@/hooks/use-reduced-motion"
import { Mark } from "@/components/mark"
import { euro, month, shares, shortMonth } from "@/lib/format"
import { REFRESH_GRANT, useAgreement } from "@/lib/terms"
import { addMonths, vestedAt, type VestEvent } from "@/lib/vesting"
import { cn } from "@/lib/utils"

type Point = [time: number, value: number]

function stepLine(changes: number[], f: (t: number) => number, t0: number, t1: number): Point[] {
  const points: Point[] = [[t0, f(t0)]]
  let level = points[0][1]
  for (const c of changes) {
    if (c <= t0 || c > t1) continue
    const next = f(c)
    if (next !== level) {
      points.push([c, level], [c, next])
      level = next
    }
  }
  points.push([t1, level])
  return points
}

export function VestingExhibit() {
  const {
    grant,
    events,
    summary,
    refreshEvents,
    refreshSummary,
    withRefresh,
    setWithRefresh,
    years,
    problem,
    today,
  } = useAgreement()

  return (
    <section
      id="vesting"
      aria-labelledby="vesting-title"
      className="mx-auto max-w-[1320px] scroll-mt-16 px-5 pt-[calc(var(--line)*1.25)] pb-[calc(var(--line)*3)] sm:px-8 lg:px-12"
    >
      <div className="grid gap-y-[var(--line)] border-t border-ink pt-[var(--line)] lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:order-2 lg:col-span-7 lg:border-l lg:border-ink lg:pl-10">
          <h2 id="vesting-title" className="voice-display text-[clamp(2.25rem,4.4vw,3.75rem)]">
            From the cliff to the last instalment.
          </h2>
          <p className="mt-6 max-w-[48ch] text-[1.0625rem] leading-relaxed text-ink-soft lg:text-[1.1875rem]">
            VestWise draws the schedule for every grant you hold, marks{" "}
            <Mark sweep="scroll">where you are today</Mark>, and adds up what vests in each
            calendar year.
          </p>
        </div>
        <p className="voice-clause read-focus text-[1.125rem] leading-[calc(var(--line)*0.85)] lg:order-1 lg:col-span-5 lg:text-[1.3125rem]">
          <span className="font-semibold">§ 2 Vesting.</span> The Virtual Shares vest in equal{" "}
          {grant.schedule} instalments over the Vesting Period. None vest before the Cliff ends;
          at that point, every instalment accrued up to then vests at once.
        </p>
      </div>

      <figure className="mt-[calc(var(--line)*1.5)]">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
          <figcaption className="text-[0.9375rem] font-semibold">Annex A. Vesting schedule</figcaption>
          <label className="flex cursor-pointer items-center gap-3 text-[0.9375rem]">
            <span className="relative grid place-items-center">
              <input
                type="checkbox"
                className="tickbox"
                checked={withRefresh}
                onChange={(event) => setWithRefresh(event.target.checked)}
              />
              {withRefresh && (
                <Check aria-hidden="true" strokeWidth={3} className="pointer-events-none absolute size-3.5 text-mark-ink" />
              )}
            </span>
            <span>
              Add a sample refresh grant{" "}
              <span className="text-ink-soft">
                ({shares(REFRESH_GRANT.shares)} shares from {month(REFRESH_GRANT.start)})
              </span>
            </span>
          </label>
        </div>

        {problem ? (
          <div className="mt-6 grid h-56 place-items-center border-y border-ink text-center">
            <p className="max-w-[36ch] text-[1.0625rem] font-semibold">
              Fill in the blanks in § 1 to draw your schedule. {problem}
            </p>
          </div>
        ) : (
          <ScheduleChart
            primary={events}
            refresh={withRefresh ? refreshEvents : null}
            cliff={grant.cliffMonths > 0 ? summary.cliffDate : null}
            end={withRefresh && refreshSummary.fullyVestedDate > summary.fullyVestedDate ? refreshSummary.fullyVestedDate : summary.fullyVestedDate}
            starts={withRefresh ? [grant.start, REFRESH_GRANT.start] : [grant.start]}
            total={grant.shares + (withRefresh ? REFRESH_GRANT.shares : 0)}
            today={today}
          />
        )}

        {!problem && (
          <p className="sr-only">
            {`${shares(summary.vestedShares)} of ${shares(grant.shares)} shares have vested. The grant is fully vested in ${month(summary.fullyVestedDate)}.`}
          </p>
        )}

        {!problem && years.length > 0 && (
          <ul aria-label="Shares vesting per calendar year" className="mt-[var(--line)] grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))]">
            {years.map((row) => {
              const current = row.year === today.getFullYear()
              return (
                <li key={row.year} className="border-t border-ink pt-3">
                  <p className="text-[0.9375rem] font-semibold">
                    {current ? <Mark>{row.year}, this year</Mark> : row.year}
                  </p>
                  <p className="voice-figure mt-2 text-[1.75rem]">{shares(Math.round(row.shares))}</p>
                  <p className="figures mt-1 text-[0.875rem] text-ink-soft">shares, {euro(row.net)} net</p>
                </li>
              )
            })}
          </ul>
        )}
      </figure>
    </section>
  )
}

interface ScheduleChartProps {
  primary: VestEvent[]
  refresh: VestEvent[] | null
  cliff: Date | null
  end: Date
  starts: Date[]
  total: number
  today: Date
}

function ScheduleChart({ primary, refresh, cliff, end, starts, total, today }: ScheduleChartProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>()
  const hatchId = useId().replace(/:/g, "")
  const [drawn, setDrawn] = useState(() => prefersReducedMotion())
  const frame = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = frame.current
    if (!node || drawn) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true)
          observer.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [drawn])

  const height = Math.round(Math.min(340, Math.max(220, width * 0.28)))

  const chart = useMemo(() => {
    if (width === 0) return null
    const earliest = Math.min(...starts.map((d) => d.getTime()), today.getTime())
    const latest = Math.max(end.getTime(), today.getTime())
    const t0 = addMonths(new Date(earliest), -2).getTime()
    const t1 = addMonths(new Date(latest), 3).getTime()

    const top = 40
    const bottom = height - 34
    const sx = (t: number) => ((t - t0) / (t1 - t0)) * width
    const sy = (v: number) => bottom - (v / total) * (bottom - top)
    const xy = ([t, v]: Point) => `${sx(t).toFixed(1)},${sy(v).toFixed(1)}`

    const primaryAt = (t: number) => vestedAt(primary, new Date(t))
    const refreshAt = (t: number) => (refresh ? vestedAt(refresh, new Date(t)) : 0)
    const changes = [...new Set([...primary, ...(refresh ?? [])].map((ev) => ev.date.getTime()))].sort(
      (a, b) => a - b,
    )

    const primaryTop = stepLine(changes, primaryAt, t0, t1)
    const totalTop = stepLine(changes, (t) => primaryAt(t) + refreshAt(t), t0, t1)
    const base: Point[] = [
      [t0, 0],
      [t1, 0],
    ]
    const area = (upper: Point[], lower: Point[]) =>
      `M${upper.map(xy).join("L")}L${[...lower].reverse().map(xy).join("L")}Z`

    const yearTicks: { x: number; label: string }[] = []
    for (let y = new Date(t0).getFullYear() + 1; y <= new Date(t1).getFullYear(); y++) {
      const t = new Date(y, 0, 1).getTime()
      if (t > t0 && t < t1) yearTicks.push({ x: sx(t), label: String(y) })
    }

    return {
      top,
      bottom,
      todayX: sx(today.getTime()),
      cliffX: cliff ? sx(cliff.getTime()) : null,
      endX: sx(end.getTime()),
      primaryArea: area(primaryTop, base),
      primaryLine: `M${primaryTop.map(xy).join("L")}`,
      refreshArea: refresh ? area(totalTop, primaryTop) : null,
      totalLine: `M${totalTop.map(xy).join("L")}`,
      halfY: sy(total / 2),
      fullY: sy(total),
      yearTicks,
    }
  }, [width, height, primary, refresh, cliff, end, starts, total, today])

  const nearRight = (x: number) => x > width - 150
  const narrow = width < 480

  return (
    <div
      ref={(node) => {
        frame.current = node
        ref(node)
      }}
      className="exhibit relative mt-6 select-none"
      data-drawn={drawn}
      style={{ height }}
      aria-hidden="true"
    >
      {chart && (
        <>
          <svg width={width} height={height} className="absolute inset-0 overflow-visible">
            <line x1={0} x2={width} y1={chart.fullY} y2={chart.fullY} stroke="var(--hairline)" />
            <line x1={0} x2={width} y1={chart.halfY} y2={chart.halfY} stroke="var(--hairline)" />
            {chart.cliffX !== null && (
              <line
                x1={chart.cliffX}
                x2={chart.cliffX}
                y1={chart.top - 18}
                y2={chart.bottom}
                stroke="var(--ink)"
                strokeDasharray="3 4"
              />
            )}
            <line x1={chart.endX} x2={chart.endX} y1={chart.top - 18} y2={chart.bottom} stroke="var(--ink)" strokeDasharray="3 4" />
            {chart.yearTicks.map((tick) => (
              <line key={tick.label} x1={tick.x} x2={tick.x} y1={chart.bottom} y2={chart.bottom + 7} stroke="var(--ink)" />
            ))}
          </svg>

          {/* What is still to come: outlined, revealed after the past is drawn */}
          <div
            className="exhibit-future absolute inset-0"
            style={{ "--future-inset": `${Math.max(0, chart.todayX)}px` } as CSSProperties}
          >
            <svg width={width} height={height} className="absolute inset-0">
              <path d={chart.primaryArea} fill="var(--ink)" fillOpacity={0.07} />
              <path d={chart.primaryLine} fill="none" stroke="var(--ink)" strokeWidth={1.5} />
              {chart.refreshArea && (
                <path d={chart.totalLine} fill="none" stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="5 4" />
              )}
            </svg>
          </div>

          {/* What has vested: solid ink, drawn left to right up to today */}
          <div
            className="exhibit-past absolute inset-0"
            style={{ "--past-inset": `${Math.max(0, width - chart.todayX)}px` } as CSSProperties}
          >
            <svg width={width} height={height} className="absolute inset-0">
              <defs>
                <pattern id={hatchId} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1={0} y1={0} x2={0} y2={6} stroke="var(--ink)" strokeWidth={2} />
                </pattern>
              </defs>
              <path d={chart.primaryArea} fill="var(--ink)" />
              {chart.refreshArea && <path d={chart.refreshArea} fill={`url(#${hatchId})`} stroke="var(--ink)" strokeWidth={1.5} />}
            </svg>
          </div>

          <svg width={width} height={height} className="pointer-events-none absolute inset-0">
            <line x1={0} x2={width} y1={chart.bottom} y2={chart.bottom} stroke="var(--ink)" />
          </svg>

          {/* Labels */}
          <span className="figures absolute left-0 -translate-y-full pb-1 text-[0.75rem] text-ink-muted" style={{ top: chart.fullY }}>
            {shares(total)}
          </span>
          {chart.cliffX !== null && (
            <ChartLabel x={chart.cliffX} y={chart.top - 18} anchorRight={nearRight(chart.cliffX)} title="Cliff" detail={cliff ? shortMonth(cliff) : ""} />
          )}
          <ChartLabel x={chart.endX} y={chart.top - 18} anchorRight title="Fully vested" detail={narrow ? "" : shortMonth(end)} />
          {chart.yearTicks.map((tick) => (
            <span
              key={tick.label}
              className="figures absolute -translate-x-1/2 text-[0.75rem] text-ink-soft"
              style={{ left: tick.x, top: chart.bottom + 10 }}
            >
              {tick.label}
            </span>
          ))}

          <div className="exhibit-flag absolute top-0 bottom-[34px] w-1 -translate-x-1/2 bg-mark" style={{ left: chart.todayX }}>
            <span
              className={cn(
                "absolute top-0 bg-mark px-2 py-1 text-[0.75rem] leading-none font-bold whitespace-nowrap text-mark-ink",
                nearRight(chart.todayX) ? "right-0" : "left-0",
              )}
            >
              Today
            </span>
          </div>
        </>
      )}
    </div>
  )
}

function ChartLabel({
  x,
  y,
  title,
  detail,
  anchorRight,
}: {
  x: number
  y: number
  title: string
  detail: string
  anchorRight?: boolean
}) {
  return (
    <span
      className={cn(
        "absolute -translate-y-full pb-1.5 text-[0.75rem] leading-tight whitespace-nowrap",
        anchorRight ? "-translate-x-full pr-2 text-right" : "pl-2",
      )}
      style={{ left: x, top: y + 18 }}
    >
      <span className="font-bold">{title}</span> <span className="text-ink-soft">{detail}</span>
    </span>
  )
}
