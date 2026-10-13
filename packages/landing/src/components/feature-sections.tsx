import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useInView } from "@/hooks/use-in-view"
import { ScrollAnimate } from "@/components/scroll-animate"
import {
  cumulativeData,
  grantAEvents,
  grantBEvents,
  grantAInfo,
  grantBInfo,
  yearlySummaryData,
  SAMPLE_TODAY,
} from "@/lib/sample-data"

// --- Shared helpers ---

function formatMonthYear(ts: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
  }).format(new Date(ts))
}

function formatNumber(v: number): string {
  return v.toLocaleString("en-US")
}

// --- Chart that only mounts when scrolled into view ---
// Drop-in for ChartContainer. The placeholder takes the chart's own sizing
// classes, so mounting the chart doesn't shift the layout.

function ScrollChart({
  config,
  className,
  children,
}: {
  config: ChartConfig
  className: string
  children: React.ComponentProps<typeof ChartContainer>["children"]
}) {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true })

  if (!inView) return <div ref={ref} className={className} />

  return (
    <ChartContainer config={config} className={className}>
      {children}
    </ChartContainer>
  )
}

// ============================================================
// SECTION 1: Cumulative Vesting
// ============================================================

const cumulativeConfig = {
  totalVested: { label: "Vested", color: "var(--color-chart-5)" },
  totalUnvested: { label: "Unvested", color: "var(--color-chart-1)" },
} satisfies ChartConfig

const cumMin = cumulativeData[0].date
const cumMax = cumulativeData[cumulativeData.length - 1].date
const cumTodayPct = `${((SAMPLE_TODAY - cumMin) / (cumMax - cumMin)) * 100}%`

export function CumulativeSection() {
  return (
    <section className="border-t border-border/50">
      <div className="mx-auto max-w-5xl px-6 py-32 sm:py-40">
        <ScrollAnimate>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
              The full picture
            </p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              See your total equity
              <br />
              at a glance
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              The cumulative chart shows your combined vested and unvested shares
              across all grants. Past vesting is highlighted, future tranches
              fade — so you always know where you stand.
            </p>
          </div>
        </ScrollAnimate>

        <div className="mt-16 sm:mt-20 rounded-xl border border-border/50 bg-card p-4 sm:p-6">
          <ScrollChart config={cumulativeConfig} className="aspect-[4/3] w-full md:aspect-[5/2]">
            <AreaChart data={cumulativeData} stackOffset="none">
              <defs>
                <linearGradient id="s1-vestedFade" x1="0" y1="0" x2="1" y2="0">
                  <stop offset={cumTodayPct} stopColor="var(--color-totalVested)" stopOpacity={0.6} />
                  <stop offset={cumTodayPct} stopColor="var(--color-totalVested)" stopOpacity={0.15} />
                </linearGradient>
                <linearGradient id="s1-unvestedFade" x1="0" y1="0" x2="1" y2="0">
                  <stop offset={cumTodayPct} stopColor="var(--color-totalUnvested)" stopOpacity={0.3} />
                  <stop offset={cumTodayPct} stopColor="var(--color-totalUnvested)" stopOpacity={0.08} />
                </linearGradient>
                <linearGradient id="s1-vestedStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset={cumTodayPct} stopColor="var(--color-totalVested)" stopOpacity={1} />
                  <stop offset={cumTodayPct} stopColor="var(--color-totalVested)" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="s1-unvestedStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset={cumTodayPct} stopColor="var(--color-totalUnvested)" stopOpacity={1} />
                  <stop offset={cumTodayPct} stopColor="var(--color-totalUnvested)" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={formatMonthYear}
                tickLine={false}
                axisLine={false}
              />
              <YAxis tickLine={false} axisLine={false} width={60} tickFormatter={formatNumber} />
              <ChartTooltip
                isAnimationActive={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const ts = payload?.[0]?.payload?.date as number | undefined
                      return ts ? formatMonthYear(ts) : ""
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                dataKey="totalVested"
                type="stepAfter"
                stackId="a"
                fill="url(#s1-vestedFade)"
                stroke="url(#s1-vestedStroke)"
                fillOpacity={1}
                animationDuration={2500}
                animationEasing="ease-out"
              />
              <Area
                dataKey="totalUnvested"
                type="stepAfter"
                stackId="a"
                fill="url(#s1-unvestedFade)"
                stroke="url(#s1-unvestedStroke)"
                fillOpacity={1}
                animationDuration={2500}
                animationEasing="ease-out"
              />
              <ReferenceLine
                x={SAMPLE_TODAY}
                stroke="var(--color-foreground)"
                strokeDasharray="4 4"
                label={{
                  value: "Today",
                  position: "insideTopRight",
                  fontSize: 11,
                  fill: "var(--color-foreground)",
                }}
              />
            </AreaChart>
          </ScrollChart>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// SECTION 2: Multi-grant
// ============================================================

const grantConfig = {
  vested: { label: "Vested", color: "var(--color-chart-5)" },
} satisfies ChartConfig

function GrantChart({
  events,
  info,
  prefix,
}: {
  events: { date: number; vested: number }[]
  info: typeof grantAInfo
  prefix: string
}) {
  const chartMin = events[0].date
  const chartMax = events[events.length - 1].date
  const showToday = SAMPLE_TODAY >= chartMin && SAMPLE_TODAY <= chartMax
  const todayPct = showToday
    ? `${((SAMPLE_TODAY - chartMin) / (chartMax - chartMin)) * 100}%`
    : null

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 sm:p-6">
      <div className="mb-4">
        <p className="text-sm font-semibold">{info.label}</p>
        <p className="text-xs text-muted-foreground">
          {formatNumber(info.shares)} shares &middot; {info.months}mo &middot; {info.cliff}mo cliff
        </p>
      </div>
      <ScrollChart config={grantConfig} className="aspect-[4/3] w-full md:aspect-[2/1]">
        <AreaChart data={events}>
          {todayPct && (
            <defs>
              <linearGradient id={`${prefix}-fade`} x1="0" y1="0" x2="1" y2="0">
                <stop offset={todayPct} stopColor="var(--color-vested)" stopOpacity={0.4} />
                <stop offset={todayPct} stopColor="var(--color-vested)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id={`${prefix}-stroke`} x1="0" y1="0" x2="1" y2="0">
                <stop offset={todayPct} stopColor="var(--color-vested)" stopOpacity={1} />
                <stop offset={todayPct} stopColor="var(--color-vested)" stopOpacity={0.3} />
              </linearGradient>
            </defs>
          )}
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={formatMonthYear}
            tickLine={false}
            axisLine={false}
          />
          <YAxis tickLine={false} axisLine={false} width={50} tickFormatter={formatNumber} />
          <ChartTooltip
            isAnimationActive={false}
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  const ts = payload?.[0]?.payload?.date as number | undefined
                  return ts ? formatMonthYear(ts) : ""
                }}
              />
            }
          />
          {info.cliffDate >= chartMin && info.cliffDate <= chartMax && (
            <ReferenceLine
              x={info.cliffDate}
              stroke="var(--color-muted-foreground)"
              strokeDasharray="4 4"
              label={{
                value: "Cliff",
                position: "insideTopRight",
                fontSize: 11,
                fill: "var(--color-muted-foreground)",
              }}
            />
          )}
          {showToday && (
            <ReferenceLine
              x={SAMPLE_TODAY}
              stroke="var(--color-foreground)"
              strokeDasharray="4 4"
              label={{
                value: "Today",
                position: "insideTopRight",
                fontSize: 11,
                fill: "var(--color-foreground)",
              }}
            />
          )}
          <Area
            dataKey="vested"
            type="stepAfter"
            fill={todayPct ? `url(#${prefix}-fade)` : "var(--color-vested)"}
            stroke={todayPct ? `url(#${prefix}-stroke)` : "var(--color-vested)"}
            fillOpacity={todayPct ? 1 : 0.4}
            animationDuration={2000}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ScrollChart>
    </div>
  )
}

export function MultiGrantSection() {
  return (
    <section className="border-t border-border/50">
      <div className="mx-auto max-w-5xl px-6 py-32 sm:py-40">
        <ScrollAnimate>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
              Multiple grants
            </p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Track every grant,
              <br />
              side by side
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Got a refresh grant on top of your initial package? Different cliff
              dates and vesting cadences? Each grant gets its own chart with cliff
              markers, and everything rolls up into a single view.
            </p>
          </div>
        </ScrollAnimate>

        <div className="mt-16 sm:mt-20 grid gap-4 sm:grid-cols-2">
          <GrantChart events={grantAEvents} info={grantAInfo} prefix="s2a" />
          <GrantChart events={grantBEvents} info={grantBInfo} prefix="s2b" />
        </div>
      </div>
    </section>
  )
}

// ============================================================
// SECTION 3: Yearly summary
// ============================================================

const yearlyConfig = {
  sharesVesting: { label: "Shares vesting", color: "var(--color-chart-3)" },
} satisfies ChartConfig

export function YearlySection() {
  return (
    <section className="border-t border-border/50">
      <div className="mx-auto max-w-5xl px-6 py-32 sm:py-40">
        <ScrollAnimate>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
              Year by year
            </p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Know how much
              <br />
              vests each year
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              When you have grants with different start dates and schedules,
              the yearly breakdown shows exactly how many shares vest per calendar
              year — across all your grants combined.
            </p>
          </div>
        </ScrollAnimate>

        <div className="mt-16 sm:mt-20 rounded-xl border border-border/50 bg-card p-4 sm:p-6">
          <ScrollChart config={yearlyConfig} className="aspect-[4/3] w-full md:aspect-[5/2]">
            <BarChart data={yearlySummaryData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="year" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={60} tickFormatter={formatNumber} />
              <ChartTooltip
                isAnimationActive={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span>
                        {typeof value === "number" ? formatNumber(value) : value} shares
                      </span>
                    )}
                  />
                }
              />
              <Bar
                dataKey="sharesVesting"
                fill="var(--color-sharesVesting)"
                radius={[4, 4, 0, 0]}
                animationDuration={2000}
                animationEasing="ease-out"
              />
            </BarChart>
          </ScrollChart>
        </div>
      </div>
    </section>
  )
}
