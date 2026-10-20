import { useId } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"
import { euro, euroCompact, multiple } from "@vestwise/brand"

import { Part } from "@/components/brand/part"
import { ExhibitFlag, ExhibitLabel } from "@/components/charts/exhibit"
import {
  EXHIBIT_ANIMATION,
  EXHIBIT_MARGIN,
} from "@/components/charts/exhibit-scale"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { PotentialScenario } from "@/lib/potential"

const chartConfig = {
  netValue: { label: "Net payout" },
  dilutedNetValue: { label: "After dilution" },
} satisfies ChartConfig

const TICKS = [1, 5, 10, 15, 20]

interface PotentialChartProps {
  data: PotentialScenario[]
  multiplier: number
  dilutionPercent: number
}

// The payout curve, drawn as an exhibit: today as a dashed line, the exit the
// reader set as the yellow bar
export function PotentialChart({
  data,
  multiplier,
  dilutionPercent,
}: PotentialChartProps) {
  const id = useId().replace(/:/g, "")
  const showDilution = dilutionPercent > 0
  const chosen = Math.min(20, Math.max(0.5, multiplier))

  return (
    <Part
      title="Net payout by valuation multiple"
      description="What an exit would pay at each multiple of today's valuation, from 0.5× to 20×."
    >
      <ChartContainer
        config={chartConfig}
        className="aspect-[2/1] w-full select-none"
      >
        <AreaChart data={data} margin={EXHIBIT_MARGIN}>
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ink)" stopOpacity={0.07} />
              <stop offset="100%" stopColor="var(--ink)" stopOpacity={0.07} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="multiplier"
            type="number"
            domain={[0.5, 20]}
            ticks={TICKS}
            tickFormatter={(v: number) => multiple(v)}
            tickSize={7}
            tickLine={{ stroke: "var(--ink)" }}
            axisLine={{ stroke: "var(--ink)" }}
            tickMargin={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(v: number) => euroCompact(v)}
          />
          <ChartTooltip
            cursor={{ stroke: "var(--ink)", strokeDasharray: "3 4" }}
            content={
              <ChartTooltipContent
                hideIndicator
                labelFormatter={(_label, payload) => {
                  const m = payload?.[0]?.payload?.multiplier
                  return m != null ? `${multiple(m)} today's valuation` : ""
                }}
                formatter={(value, name) => {
                  const config = chartConfig[name as keyof typeof chartConfig]
                  return (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-ink-soft">{config?.label}</span>
                      <span className="font-semibold">
                        {euro(value as number)}
                      </span>
                    </div>
                  )
                }}
              />
            }
          />
          <Area
            dataKey="netValue"
            type="linear"
            fill={`url(#${id}-fill)`}
            fillOpacity={1}
            stroke="var(--ink)"
            strokeWidth={1.5}
            {...EXHIBIT_ANIMATION}
          />
          {showDilution && (
            <Line
              dataKey="dilutedNetValue"
              type="linear"
              dot={false}
              stroke="var(--ink)"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              {...EXHIBIT_ANIMATION}
            />
          )}
          <ReferenceLine
            x={1}
            stroke="var(--ink)"
            strokeDasharray="3 4"
            label={<ExhibitLabel title="Today" detail="1×" />}
          />
          <ReferenceLine
            x={chosen}
            stroke="var(--mark)"
            strokeWidth={4}
            label={
              <ExhibitFlag
                text={multiple(chosen)}
                anchor={chosen > 16 ? "end" : "start"}
              />
            }
          />
        </AreaChart>
      </ChartContainer>
      <p className="mt-3 text-[0.8125rem] leading-snug text-ink-muted">
        The yellow bar is the exit you set above.
        {showDilution && " The dashed line is the payout after dilution."}
      </p>
    </Part>
  )
}
