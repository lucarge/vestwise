import { useId, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  euro,
  euroCompact,
  formatDate,
  percentPrecise,
  shortMonth,
} from "@vestwise/brand"

import { PageHeader } from "@/components/brand/page-header"
import { Part } from "@/components/brand/part"
import {
  EXHIBIT_ANIMATION,
  EXHIBIT_MARGIN,
  yearTicks,
} from "@/components/charts/exhibit-scale"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { ValuationForm } from "@/components/valuation-form"
import { useValuations } from "@/hooks/use-valuations"
import { computeCumulativeDilution } from "@/lib/valuation"
import type { ValuationEntry } from "@/types/valuation"

const chartConfig = {
  valuation: { label: "Valuation" },
} satisfies ChartConfig

export function ValuationsPage() {
  const { valuations, addValuation, updateValuation, removeValuation } =
    useValuations()
  const [editingEntry, setEditingEntry] = useState<ValuationEntry | null>(null)
  const [now] = useState(Date.now)
  const id = useId().replace(/:/g, "")

  const sorted = [...valuations].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  )

  const cumulativeDilution = computeCumulativeDilution(valuations)
  const hasAnyRaise = valuations.some(
    (v) => v.amountRaised && v.amountRaised > 0
  )

  // Each valuation holds until the next one, so the latest holds until today
  const sortedAsc = [...valuations].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )
  const latest = sortedAsc[sortedAsc.length - 1]
  const chartData = sortedAsc.map((v) => ({
    date: v.date.getTime(),
    valuation: v.valuation,
  }))
  if (latest && latest.date.getTime() < now) {
    chartData.push({ date: now, valuation: latest.valuation })
  }
  const chartMin = chartData[0]?.date ?? 0
  const chartMax = chartData[chartData.length - 1]?.date ?? 0

  function handleUpdate(entry: ValuationEntry) {
    updateValuation(entry)
    setEditingEntry(null)
  }

  return (
    <div className="flex flex-col gap-line">
      <PageHeader
        title="Valuations"
        lede="Your company's valuation over time. Each grant is matched to the latest valuation on or before its grant date, and funding rounds add up to your dilution."
      />

      <Part title="Add a valuation">
        <ValuationForm onAdd={addValuation} />
      </Part>

      {sorted.length > 0 && (
        <Part title="History">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Valuation</TableHead>
                {hasAnyRaise && (
                  <TableHead className="text-right">Raised</TableHead>
                )}
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="figures">
                    {formatDate(entry.date)}
                  </TableCell>
                  <TableCell className="figures text-right">
                    {euro(entry.valuation)}
                  </TableCell>
                  {hasAnyRaise && (
                    <TableCell className="figures text-right">
                      {entry.amountRaised ? (
                        euro(entry.amountRaised)
                      ) : (
                        <span className="text-ink-muted">none</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setEditingEntry(entry)}
                        aria-label="Edit valuation"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeValuation(entry.id)}
                        aria-label="Remove valuation"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {cumulativeDilution > 0 && (
            <p className="figures mt-4 text-[0.9375rem] text-ink-soft">
              Cumulative dilution from your funding rounds:{" "}
              <span className="font-semibold text-ink">
                {percentPrecise(cumulativeDilution, 2)}
              </span>
            </p>
          )}
        </Part>
      )}

      {chartData.length >= 2 && (
        <Part
          title="Valuation over time"
          description="Each valuation holds until the next one."
        >
          <ChartContainer
            config={chartConfig}
            className="aspect-[2/1] w-full select-none"
          >
            <AreaChart data={chartData} margin={EXHIBIT_MARGIN}>
              <defs>
                <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--ink)" stopOpacity={0.07} />
                  <stop
                    offset="100%"
                    stopColor="var(--ink)"
                    stopOpacity={0.07}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                type="number"
                domain={["dataMin", "dataMax"]}
                ticks={yearTicks(chartMin, chartMax)}
                tickFormatter={(ts: number) =>
                  String(new Date(ts).getFullYear())
                }
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
                    labelFormatter={(_, payload) => {
                      const ts = payload?.[0]?.payload?.date as
                        | number
                        | undefined
                      return ts ? shortMonth(new Date(ts)) : ""
                    }}
                    formatter={(value) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-ink-soft">Valuation</span>
                        <span className="font-semibold">
                          {euro(value as number)}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Area
                dataKey="valuation"
                type="stepAfter"
                fill={`url(#${id}-fill)`}
                fillOpacity={1}
                stroke="var(--ink)"
                strokeWidth={1.5}
                {...EXHIBIT_ANIMATION}
              />
            </AreaChart>
          </ChartContainer>
        </Part>
      )}

      <Dialog
        open={editingEntry !== null}
        onOpenChange={(open) => {
          if (!open) setEditingEntry(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit valuation</DialogTitle>
            <DialogDescription>
              Change the date, the valuation or the amount raised.
            </DialogDescription>
          </DialogHeader>
          {editingEntry && (
            <ValuationForm
              key={editingEntry.id}
              initialEntry={editingEntry}
              onUpdate={handleUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
