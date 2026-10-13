import { Area, AreaChart, CartesianGrid, ReferenceLine, YAxis } from "recharts"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { heroChartData, SAMPLE_TODAY } from "@/lib/sample-data"

const chartConfig = {
  totalVested: {
    label: "Vested",
    color: "var(--color-chart-5)",
  },
  totalUnvested: {
    label: "Unvested",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig

const chartMin = heroChartData[0].date
const chartMax = heroChartData[heroChartData.length - 1].date
const todayPct = `${((SAMPLE_TODAY - chartMin) / (chartMax - chartMin)) * 100}%`

// Edges fade via a mask (not background-colored overlays), so the fades
// track the chart at any width and work in either theme
export function HeroChart() {
  return (
    <div
      className="pointer-events-none select-none mask-x-from-85% mask-t-from-80% mask-b-from-50%"
      aria-hidden="true"
    >
      <ChartContainer config={chartConfig} className="aspect-[3/1] w-full sm:aspect-[4/1]">
        <AreaChart data={heroChartData} stackOffset="none" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="hero-vestedFade" x1="0" y1="0" x2="1" y2="0">
              <stop offset={todayPct} stopColor="var(--color-totalVested)" stopOpacity={0.45} />
              <stop offset={todayPct} stopColor="var(--color-totalVested)" stopOpacity={0.08} />
            </linearGradient>
            <linearGradient id="hero-unvestedFade" x1="0" y1="0" x2="1" y2="0">
              <stop offset={todayPct} stopColor="var(--color-totalUnvested)" stopOpacity={0.2} />
              <stop offset={todayPct} stopColor="var(--color-totalUnvested)" stopOpacity={0.04} />
            </linearGradient>
            <linearGradient id="hero-vestedStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset={todayPct} stopColor="var(--color-totalVested)" stopOpacity={0.6} />
              <stop offset={todayPct} stopColor="var(--color-totalVested)" stopOpacity={0.15} />
            </linearGradient>
            <linearGradient id="hero-unvestedStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset={todayPct} stopColor="var(--color-totalUnvested)" stopOpacity={0.5} />
              <stop offset={todayPct} stopColor="var(--color-totalUnvested)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeOpacity={0.3} />
          <YAxis hide />
          <Area
            dataKey="totalVested"
            type="stepAfter"
            stackId="a"
            fill="url(#hero-vestedFade)"
            stroke="url(#hero-vestedStroke)"
            fillOpacity={1}
            animationDuration={2000}
            animationEasing="ease-out"
          />
          <Area
            dataKey="totalUnvested"
            type="stepAfter"
            stackId="a"
            fill="url(#hero-unvestedFade)"
            stroke="url(#hero-unvestedStroke)"
            fillOpacity={1}
            animationDuration={2000}
            animationEasing="ease-out"
          />
          <ReferenceLine
            x={SAMPLE_TODAY}
            stroke="var(--color-foreground)"
            strokeDasharray="4 4"
            strokeOpacity={0.25}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
