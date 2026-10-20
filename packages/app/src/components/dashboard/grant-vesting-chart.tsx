import { useId, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"
import { addMonths } from "date-fns"
import {
  amount,
  euro,
  formatDateLong,
  month,
  shares,
  shortMonth,
} from "@vestwise/brand"

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
import type { Grant } from "@/types/grant"
import type { GrantVestingTimeline } from "@/types/vesting"

const chartConfig = {
  vested: { label: "Vested" },
} satisfies ChartConfig

interface GrantVestingChartProps {
  grant: Grant
  timeline: GrantVestingTimeline
}

// One grant: its terms in the agreement's voice, its schedule as an exhibit
export function GrantVestingChart({ grant, timeline }: GrantVestingChartProps) {
  const id = useId().replace(/:/g, "")
  const [now] = useState(Date.now)

  const chartData = [
    { date: grant.grantDate.getTime(), vested: 0 },
    ...timeline.events.map((ev) => ({
      date: ev.date.getTime(),
      vested: ev.cumulativeVested,
    })),
  ]
  const chartMin = chartData[0].date
  const chartMax = chartData[chartData.length - 1].date
  const showToday = now >= chartMin && now <= chartMax
  const past = todayFraction(now, chartMin, chartMax)

  const cliffDate =
    grant.cliffMonths > 0 ? addMonths(grant.grantDate, grant.cliffMonths) : null
  const lastEvent = timeline.events[timeline.events.length - 1]
  const isFullyVested = lastEvent ? now >= lastEvent.date.getTime() : false
  const vestedNow = timeline.events.reduce(
    (acc, ev) => (ev.date.getTime() <= now ? ev.cumulativeVested : acc),
    0
  )
  const valuePerShare =
    grant.grantedAmount > 0 ? grant.vsopsValue / grant.grantedAmount : 0
  const vestedNet = vestedNow * (valuePerShare - grant.vsopsStrikePrice)
  const total = Math.max(1, grant.grantedAmount)

  return (
    <article className="border-t border-ink pt-4">
      <p className="voice-clause text-[1.0625rem] leading-relaxed lg:text-[1.125rem]">
        <span className="font-semibold">
          Grant of {formatDateLong(grant.grantDate)}.
        </span>{" "}
        {shares(grant.grantedAmount)} Virtual Shares at EUR{" "}
        {amount(valuePerShare)} per share, Strike Price EUR{" "}
        {amount(grant.vsopsStrikePrice)}, vesting {grant.vestingSchedule} over{" "}
        {grant.vestingPeriodMonths} months
        {grant.cliffMonths > 0
          ? ` after a Cliff of ${grant.cliffMonths} months`
          : ""}
        .
      </p>
      <p className="figures mt-3 text-[0.9375rem] leading-snug text-ink-soft">
        {isFullyVested && lastEvent ? (
          <>
            Fully vested since{" "}
            <span className="font-semibold text-ink">
              {month(lastEvent.date)}
            </span>
            .
          </>
        ) : (
          <>
            <span className="font-semibold text-ink">
              {shares(Math.round(vestedNow))}
            </span>{" "}
            vested,{" "}
            <span className="font-semibold text-ink">{euro(vestedNet)}</span>{" "}
            net today.
          </>
        )}
      </p>
      <ChartContainer
        config={chartConfig}
        className="mt-4 aspect-[2/1] w-full select-none"
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
            width={52}
            tickFormatter={(v: number) => shares(Math.round(v))}
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
                formatter={(value) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-ink-soft">Vested</span>
                    <span className="font-semibold">
                      {shares(Math.round(value as number))}
                    </span>
                  </div>
                )}
              />
            }
          />
          {cliffDate && (
            <ReferenceLine
              x={cliffDate.getTime()}
              stroke="var(--ink)"
              strokeDasharray="3 4"
              label={
                <ExhibitLabel title="Cliff" detail={shortMonth(cliffDate)} />
              }
            />
          )}
          {lastEvent && (
            <ReferenceLine
              x={lastEvent.date.getTime()}
              stroke="var(--ink)"
              strokeDasharray="3 4"
              label={<ExhibitLabel title="Fully vested" anchor="end" />}
            />
          )}
          <Area
            dataKey="vested"
            type="stepAfter"
            fill={`url(#${id}-fill)`}
            fillOpacity={1}
            stroke={`url(#${id}-stroke)`}
            strokeWidth={1.5}
            {...EXHIBIT_ANIMATION}
          />
          {showToday && (
            <ReferenceLine
              x={now}
              stroke="var(--mark)"
              strokeWidth={4}
              label={<ExhibitFlag anchor={past > 0.78 ? "end" : "start"} />}
            />
          )}
        </AreaChart>
      </ChartContainer>
    </article>
  )
}
