import { useId, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"
import { euro, euroCompact, month, shares, shortMonth } from "@vestwise/brand"

import { Part } from "@/components/brand/part"
import {
  ExhibitFlag,
  ExhibitLabel,
  PastFutureFill,
  PastFutureStroke,
} from "@/components/charts/exhibit"
import {
  EXHIBIT_ANIMATION,
  EXHIBIT_MARGIN,
  todayFraction,
  yearTicks,
} from "@/components/charts/exhibit-scale"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CumulativePoint } from "@/types/vesting"

type ChartMode = "shares" | "value"
const CHART_MODE_KEY = "vsop-cumulative-chart-mode"

const chartConfig = {
  vested: { label: "Vested" },
  appreciated: { label: "At today's valuation" },
} satisfies ChartConfig

interface CumulativeChartProps {
  data: CumulativePoint[]
}

// Annex A: every grant's schedule added up, drawn as the exhibit
export function CumulativeChart({ data }: CumulativeChartProps) {
  const id = useId().replace(/:/g, "")
  const [mode, setMode] = useState<ChartMode>(() => {
    const stored = localStorage.getItem(CHART_MODE_KEY)
    return stored === "value" ? "value" : "shares"
  })
  const [now] = useState(Date.now)

  function handleModeChange(newMode: string | number) {
    const m = newMode as ChartMode
    setMode(m)
    localStorage.setItem(CHART_MODE_KEY, m)
  }

  const isValue = mode === "value"

  // The vested value at today's valuation is worth its own line once it
  // differs from the grant value by more than a tenth
  const lastPoint = data[data.length - 1]
  const appreciationPct =
    lastPoint?.totalAppreciatedVestedValue !== undefined &&
    lastPoint.totalVestedValue > 0
      ? ((lastPoint.totalAppreciatedVestedValue - lastPoint.totalVestedValue) /
          lastPoint.totalVestedValue) *
        100
      : 0
  const showAppreciation = isValue && Math.abs(appreciationPct) > 10

  const chartData = data.map((p) => ({
    date: p.date.getTime(),
    vested: isValue ? p.totalVestedValue : p.totalVested,
    total: isValue
      ? p.totalVestedValue + p.totalUnvestedValue
      : p.totalVested + p.totalUnvested,
    ...(showAppreciation ? { appreciated: p.totalAppreciatedVestedValue } : {}),
  }))

  const chartMin = chartData[0].date
  const chartMax = chartData[chartData.length - 1].date
  const showToday = now >= chartMin && now <= chartMax
  const past = todayFraction(now, chartMin, chartMax)
  const total = Math.max(1, ...chartData.map((p) => p.total))
  const fullyVested = data[data.length - 1].date
  const format = isValue ? euro : (v: number) => shares(Math.round(v))

  return (
    <Part
      title="Annex A. Vesting schedule"
      description={
        isValue
          ? "Vested value across every grant, at the value per share of each grant."
          : "Vested shares across every grant, instalment by instalment."
      }
      action={
        <Tabs value={mode} onValueChange={handleModeChange}>
          <TabsList aria-label="Draw the schedule in">
            <TabsTrigger value="shares">Shares</TabsTrigger>
            <TabsTrigger value="value">Value</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      <ChartContainer
        config={chartConfig}
        className="aspect-[2/1] w-full select-none"
      >
        <AreaChart data={chartData} margin={EXHIBIT_MARGIN}>
          <defs>
            <PastFutureFill id={`${id}-fill`} at={past} />
            <PastFutureStroke id={`${id}-stroke`} at={past} />
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            type="number"
            domain={["dataMin", "dataMax"]}
            ticks={yearTicks(chartMin, chartMax)}
            tickFormatter={(ts: number) => String(new Date(ts).getFullYear())}
            tickSize={7}
            tickLine={{ stroke: "var(--ink)" }}
            axisLine={{ stroke: "var(--ink)" }}
            tickMargin={6}
          />
          <YAxis
            domain={[0, total]}
            ticks={[total / 2, total]}
            tickLine={false}
            axisLine={false}
            width={isValue ? 64 : 56}
            tickFormatter={(v: number) =>
              isValue ? euroCompact(v) : shares(Math.round(v))
            }
          />
          <ChartTooltip
            cursor={{ stroke: "var(--ink)", strokeDasharray: "3 4" }}
            content={
              <ChartTooltipContent
                hideIndicator
                labelFormatter={(_, payload) => {
                  const ts = payload?.[0]?.payload?.date as number | undefined
                  return ts ? shortMonth(new Date(ts)) : ""
                }}
                formatter={(value, name) => {
                  const config = chartConfig[name as keyof typeof chartConfig]
                  return (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-ink-soft">{config?.label}</span>
                      <span className="font-semibold">
                        {format(value as number)}
                      </span>
                    </div>
                  )
                }}
              />
            }
          />
          <Area
            dataKey="vested"
            type="stepAfter"
            fill={`url(#${id}-fill)`}
            fillOpacity={1}
            stroke={`url(#${id}-stroke)`}
            strokeWidth={1.5}
            {...EXHIBIT_ANIMATION}
          />
          {showAppreciation && (
            <Line
              dataKey="appreciated"
              type="stepAfter"
              dot={false}
              stroke="var(--ink)"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              {...EXHIBIT_ANIMATION}
            />
          )}
          <ReferenceLine
            x={fullyVested.getTime()}
            stroke="var(--ink)"
            strokeDasharray="3 4"
            label={
              <ExhibitLabel
                title="Fully vested"
                detail={shortMonth(fullyVested)}
                anchor="end"
              />
            }
          />
          {showToday && (
            <ReferenceLine
              x={now}
              stroke="var(--mark)"
              strokeWidth={4}
              label={<ExhibitFlag anchor={past > 0.82 ? "end" : "start"} />}
            />
          )}
        </AreaChart>
      </ChartContainer>
      <p className="mt-3 text-[0.8125rem] leading-snug text-ink-muted">
        Solid ink has vested; the outline is still to come, fully vested in{" "}
        {month(fullyVested)}.
        {showAppreciation &&
          " The dashed line is the vested value at today's valuation."}
      </p>
    </Part>
  )
}
