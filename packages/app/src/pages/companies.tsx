import { useId, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Pencil, Trash2 } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  euro,
  euroCompact,
  euroPrecise,
  formatDate,
  percentPrecise,
  shares,
  shortMonth,
} from "@vestwise/brand"

import { Notice } from "@/components/brand/notice"
import { PageHeader } from "@/components/brand/page-header"
import { Part } from "@/components/brand/part"
import {
  EXHIBIT_ANIMATION,
  EXHIBIT_MARGIN,
  yearTicks,
} from "@/components/charts/exhibit-scale"
import { CompanyForm } from "@/components/company-form"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
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
import { ValuationForm } from "@/components/valuation-form"
import { useCompanies } from "@/hooks/use-companies"
import { useGrants } from "@/hooks/use-grants"
import {
  cumulativeDilution,
  latestCounted,
  latestPriced,
  latestValuation,
  priceOf,
  sharesOf,
  sortedValuations,
  valuationOf,
} from "@/lib/company"
import type { Company } from "@/types/company"
import type { ValuationEntry } from "@/types/valuation"

type Editing =
  | { kind: "add-company" }
  | { kind: "edit-company"; company: Company }
  | { kind: "record"; company: Company }
  | { kind: "edit-valuation"; company: Company; entry: ValuationEntry }

export function CompaniesPage() {
  const {
    companies,
    saveCompany,
    removeCompany,
    addValuation,
    updateValuation,
    removeValuation,
  } = useCompanies()
  const { grants } = useGrants()
  const [editing, setEditing] = useState<Editing | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [now] = useState(Date.now)
  const close = () => setEditing(null)

  return (
    <div className="flex flex-col gap-line">
      <PageHeader
        title="Companies"
        lede="Every company that granted you shares, with its valuations over time. Your grants are worth its latest price per share."
        action={
          <Button onClick={() => setEditing({ kind: "add-company" })}>
            Add a company
            <ArrowRight data-icon="inline-end" strokeWidth={2.25} />
          </Button>
        }
      />

      {companies.length === 0 ? (
        <div className="border-y border-ink">
          <div className="mx-auto flex min-h-[14rem] max-w-[36ch] flex-col items-center justify-center gap-5 py-line text-center">
            <h2 className="voice-display text-[1.5rem] lg:text-[1.75rem]">
              Your companies appear here once you add a grant.
            </h2>
            <Button size="lg" render={<Link to="/grants/new" />}>
              Add a grant
              <ArrowRight data-icon="inline-end" strokeWidth={2.25} />
            </Button>
          </div>
        </div>
      ) : (
        companies.map((company) => (
          <CompanyPart
            key={company.id}
            company={company}
            grantCount={grants.filter((g) => g.companyId === company.id).length}
            now={now}
            removing={removing === company.id}
            onRecord={() => setEditing({ kind: "record", company })}
            onEdit={() => setEditing({ kind: "edit-company", company })}
            onEditValuation={(entry) =>
              setEditing({ kind: "edit-valuation", company, entry })
            }
            onRemoveValuation={(id) => removeValuation(company.id, id)}
            onRemove={() => setRemoving(company.id)}
            onConfirmRemove={() => {
              removeCompany(company.id)
              setRemoving(null)
            }}
            onCancelRemove={() => setRemoving(null)}
          />
        ))
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) close()
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          {editing?.kind === "add-company" && (
            <>
              <DialogHeader>
                <DialogTitle>Add a company</DialogTitle>
                <DialogDescription>
                  Its name, the strike price its grants start from, and its
                  latest valuation.
                </DialogDescription>
              </DialogHeader>
              <CompanyForm
                companies={companies}
                onSave={(company) => {
                  saveCompany(company)
                  close()
                }}
              />
            </>
          )}
          {editing?.kind === "edit-company" && (
            <>
              <DialogHeader>
                <DialogTitle>Edit company</DialogTitle>
                <DialogDescription>
                  Change its name, or the strike price new grants start from.
                </DialogDescription>
              </DialogHeader>
              <CompanyForm
                key={editing.company.id}
                initialCompany={editing.company}
                companies={companies}
                onSave={(company) => {
                  saveCompany(company)
                  close()
                }}
              />
            </>
          )}
          {editing?.kind === "record" && (
            <>
              <DialogHeader>
                <DialogTitle>Record a valuation</DialogTitle>
                <DialogDescription>
                  {editing.company.name}: the price per share, or the
                  valuation and the shares after the round.
                </DialogDescription>
              </DialogHeader>
              <ValuationForm
                key={editing.company.id}
                onSave={(entry) => {
                  addValuation(editing.company.id, entry)
                  close()
                }}
              />
            </>
          )}
          {editing?.kind === "edit-valuation" && (
            <>
              <DialogHeader>
                <DialogTitle>Edit valuation</DialogTitle>
                <DialogDescription>
                  Change the date or the figures of this valuation of{" "}
                  {editing.company.name}.
                </DialogDescription>
              </DialogHeader>
              <ValuationForm
                key={editing.entry.id}
                initialEntry={editing.entry}
                onSave={(entry) => {
                  updateValuation(editing.company.id, entry)
                  close()
                }}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface CompanyPartProps {
  company: Company
  grantCount: number
  now: number
  removing: boolean
  onRecord: () => void
  onEdit: () => void
  onEditValuation: (entry: ValuationEntry) => void
  onRemoveValuation: (id: string) => void
  onRemove: () => void
  onConfirmRemove: () => void
  onCancelRemove: () => void
}

// One company: today's figures in a sentence, its valuations as a ledger,
// and its price per share drawn as an exhibit
function CompanyPart({
  company,
  grantCount,
  now,
  removing,
  onRecord,
  onEdit,
  onEditValuation,
  onRemoveValuation,
  onRemove,
  onConfirmRemove,
  onCancelRemove,
}: CompanyPartProps) {
  const latest = latestValuation(company)
  const history = sortedValuations(company).reverse()
  const dilution = cumulativeDilution(company)
  const hasRaise = company.valuations.some((v) => v.amountRaised)
  const unpriced = company.valuations.some((v) => priceOf(v) === undefined)
  const count = company.valuations.length

  return (
    <Part
      title={company.name}
      description={
        latest
          ? `As of ${formatDate(latest.date)}, its latest valuation.`
          : "No valuation on record yet."
      }
      action={
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={onRecord}>
            Record a valuation
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label={`Edit ${company.name}`}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            aria-label={`Remove ${company.name}`}
          >
            <Trash2 />
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {removing &&
          (grantCount > 0 ? (
            <Notice>
              <p className="text-[0.9375rem] leading-snug">
                {company.name} still holds{" "}
                {grantCount === 1 ? "one of your grants" : `${grantCount} of your grants`}.
                Remove {grantCount === 1 ? "it" : "them"}, or move{" "}
                {grantCount === 1 ? "it" : "them"} to another company, first.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" render={<Link to="/grants" />}>
                  Go to your grants
                </Button>
                <Button variant="ghost" onClick={onCancelRemove}>
                  Cancel
                </Button>
              </div>
            </Notice>
          ) : (
            <Notice tone="state">
              <p className="text-[0.9375rem] leading-snug">
                This removes {company.name} and its{" "}
                {count === 1 ? "valuation" : `${count} valuations`}. It cannot
                be undone.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="destructive" onClick={onConfirmRemove}>
                  Remove company
                </Button>
                <Button variant="ghost" onClick={onCancelRemove}>
                  Cancel
                </Button>
              </div>
            </Notice>
          ))}

        <CompanyFigures company={company} />

        {history.length > 0 && (
          <Table className="whitespace-nowrap">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Valuation</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Price per share</TableHead>
                {hasRaise && <TableHead className="text-right">Raised</TableHead>}
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="figures">
                    {formatDate(entry.date)}
                    {entry.grantId && (
                      <span className="ml-2 text-[0.8125rem] text-ink-muted">
                        from a grant
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="figures text-right">
                    <Figure
                      typed={entry.valuation}
                      worked={valuationOf(entry)}
                      format={euro}
                    />
                  </TableCell>
                  <TableCell className="figures text-right">
                    <Figure
                      typed={entry.shares}
                      worked={sharesOf(entry)}
                      format={(v) => shares(Math.round(v))}
                    />
                  </TableCell>
                  <TableCell className="figures text-right">
                    <Figure
                      typed={entry.pricePerShare}
                      worked={priceOf(entry)}
                      format={euroPrecise}
                    />
                  </TableCell>
                  {hasRaise && (
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
                        onClick={() => onEditValuation(entry)}
                        aria-label="Edit valuation"
                      >
                        <Pencil />
                      </Button>
                      {/* A company keeps at least one valuation: its price */}
                      {count > 1 && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onRemoveValuation(entry.id)}
                          aria-label="Remove valuation"
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {(unpriced || dilution > 0) && (
          <div className="flex flex-col gap-2 text-[0.9375rem] leading-snug text-ink-soft">
            {unpriced && (
              <p className="max-w-[62ch]">
                A valuation marked n/a has no price per share yet. Edit it to
                add the price, or the share count to work it out.
              </p>
            )}
            {dilution > 0 && (
              <p className="figures">
                Dilution from its funding rounds:{" "}
                <span className="font-semibold text-ink">
                  {percentPrecise(dilution, 2)}
                </span>
              </p>
            )}
          </div>
        )}

        <PriceExhibit company={company} now={now} />
      </div>
    </Part>
  )
}

// A figure the reader typed is ink; one worked out from the others is soft
function Figure({
  typed,
  worked,
  format,
}: {
  typed: number | undefined
  worked: number | undefined
  format: (value: number) => string
}) {
  if (typed !== undefined) return format(typed)
  if (worked !== undefined) {
    return <span className="text-ink-soft">{format(worked)}</span>
  }
  return <span className="text-ink-muted">n/a</span>
}

// Today's figures, said as a sentence rather than set as a row of numbers:
// the price grants are valued at, and the share count ownership is measured
// against, which may come from an earlier valuation
function CompanyFigures({ company }: { company: Company }) {
  const priced = latestPriced(company)
  const counted = latestCounted(company)
  const price = priced && priceOf(priced)
  const value = priced && valuationOf(priced)
  const strong = (text: string) => (
    <span className="figures font-semibold text-ink">{text}</span>
  )

  const parts: ReactNode[] = []
  if (price !== undefined) parts.push(<>{strong(euroPrecise(price))} a share</>)
  if (counted && counted === priced) {
    parts.push(<>{strong(shares(Math.round(sharesOf(counted)!)))} shares</>)
  }
  if (value !== undefined) parts.push(<>{strong(euro(value))} post-money</>)

  return (
    <p className="max-w-[62ch] text-[0.9375rem] leading-snug text-ink-soft">
      {price === undefined ? (
        "No price per share yet: record a valuation with the price per share, or the valuation and the shares."
      ) : (
        <>
          {parts.map((part, i) => (
            <span key={i}>
              {i > 0 && (i === parts.length - 1 ? " and " : ", ")}
              {part}
            </span>
          ))}
          .
        </>
      )}
      {counted && counted !== priced && (
        <>
          {" "}
          The latest share count on record is{" "}
          {strong(shares(Math.round(sharesOf(counted)!)))}, from{" "}
          {formatDate(counted.date)}.
        </>
      )}
      {!counted && " No share count on record, so your ownership is not known yet."}
      {company.strikePrice !== undefined && (
        <>
          {" "}
          New grants start at a strike price of{" "}
          {strong(euroPrecise(company.strikePrice))}.
        </>
      )}
    </p>
  )
}

const chartConfig = {
  price: { label: "Price per share" },
} satisfies ChartConfig

// Each price holds until the next one, so the latest holds until today
function PriceExhibit({ company, now }: { company: Company; now: number }) {
  const id = useId().replace(/:/g, "")
  const priced = sortedValuations(company).filter(
    (v) => priceOf(v) !== undefined
  )
  const chartData = priced.map((v) => ({
    date: v.date.getTime(),
    price: priceOf(v)!,
  }))
  const latest = chartData[chartData.length - 1]
  if (latest && latest.date < now) {
    chartData.push({ date: now, price: latest.price })
  }
  if (chartData.length < 2) return null
  const chartMin = chartData[0].date
  const chartMax = chartData[chartData.length - 1].date

  return (
    <div className="mt-2">
      <h3 className="text-[0.9375rem] font-semibold">
        Price per share over time
      </h3>
      <p className="mt-1 text-[0.875rem] leading-snug text-ink-soft">
        Each valuation holds until the next one.
      </p>
      <ChartContainer
        config={chartConfig}
        className="mt-4 aspect-[2/1] w-full select-none"
      >
        <AreaChart data={chartData} margin={EXHIBIT_MARGIN}>
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ink)" stopOpacity={0.07} />
              <stop offset="100%" stopColor="var(--ink)" stopOpacity={0.07} />
            </linearGradient>
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
                  const ts = payload?.[0]?.payload?.date as number | undefined
                  return ts ? shortMonth(new Date(ts)) : ""
                }}
                formatter={(value) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-ink-soft">Price per share</span>
                    <span className="font-semibold">
                      {euroPrecise(value as number)}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Area
            dataKey="price"
            type="stepAfter"
            fill={`url(#${id}-fill)`}
            fillOpacity={1}
            stroke="var(--ink)"
            strokeWidth={1.5}
            {...EXHIBIT_ANIMATION}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
