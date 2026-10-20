import { useState } from "react"
import { ArrowRight, ChevronDown } from "lucide-react"
import { Link } from "react-router-dom"
import {
  BlankNumber,
  DILUTION_TICKS,
  MULTIPLE_STEPS,
  MULTIPLE_TICKS,
  RollingNumber,
  Ruler,
  decimal,
  euro,
  fitFigure,
  multiple,
  multipleFromPosition,
  percent,
  percentPrecise,
  positionFromMultiple,
  shares,
  stepMultiple,
} from "@vestwise/brand"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePotential } from "@/hooks/use-potential"
import { cn } from "@/lib/utils"
import type { Grant } from "@/types/grant"
import type { ValuationEntry } from "@/types/valuation"
import { PotentialChart } from "./potential-chart"

interface StockPotentialProps {
  grants: Grant[]
  currentValuation?: number
  calculatedDilution?: number
  valuations?: ValuationEntry[]
}

// Everything on the highlighter field is mark-ink, the tabs included
const FIELD_TAB =
  "text-mark-ink hover:text-mark-ink data-active:text-mark-ink after:bg-mark-ink"

// The page's interactive answer, on the one highlighter field: rulers on the
// left, the payout ledger on the right
export function StockPotential({
  grants,
  currentValuation,
  calculatedDilution,
  valuations,
}: StockPotentialProps) {
  const {
    multiplier,
    setMultiplier,
    dilutionPercent,
    setDilutionPercent,
    simulationMode,
    setSimulationMode,
    futureValuation,
    setFutureValuation,
    effectiveMultiplier,
    summary,
    curve,
  } = usePotential(grants, currentValuation, calculatedDilution, valuations)

  const [infoOpen, setInfoOpen] = useState(false)

  if (grants.length === 0) {
    return (
      <div className="border-y border-ink">
        <div className="mx-auto flex min-h-[14rem] max-w-[36ch] flex-col items-center justify-center gap-5 py-line text-center">
          <h2 className="voice-display text-[1.5rem] lg:text-[1.75rem]">
            Add your grants first, then see what an exit could pay.
          </h2>
          <Button size="lg" render={<Link to="/grants/new" />}>
            Add a grant
            <ArrowRight data-icon="inline-end" strokeWidth={2.25} />
          </Button>
        </div>
      </div>
    )
  }

  const payout = euro(summary.simulatedNetValue)
  const beforeDilution = summary.simulatedNetValue + summary.dilutionImpact
  const underwater = summary.simulatedNetValue <= 0
  const gain = summary.netGain
  const totalShares = grants.reduce((sum, g) => sum + g.grantedAmount, 0)
  const byValuation = simulationMode === "valuation" && !!currentValuation

  return (
    <div className="flex flex-col gap-line">
      <section
        aria-labelledby="exit-title"
        className="field bg-mark px-5 py-[calc(var(--line)*1.25)] text-mark-ink sm:px-8 lg:px-10 lg:py-[calc(var(--line)*1.5)]"
      >
        <h2
          id="exit-title"
          className="voice-display max-w-[16ch] text-[1.75rem] lg:text-[2rem]"
        >
          What would an exit pay you?
        </h2>
        <p className="mt-3 max-w-[52ch] text-[0.9375rem] leading-snug">
          Your {shares(totalShares)} shares at a future valuation, after the
          strike price and the dilution still to come.
        </p>

        <div className="mt-line grid gap-y-line lg:grid-cols-12 lg:gap-x-12">
          <div className="flex flex-col gap-line lg:col-span-6">
            <Tabs
              value={simulationMode}
              onValueChange={(v) =>
                setSimulationMode(v as "multiplier" | "valuation")
              }
            >
              <TabsList
                className="border-mark-ink"
                aria-label="Set the exit by"
              >
                <TabsTrigger value="multiplier" className={FIELD_TAB}>
                  By multiple
                </TabsTrigger>
                <TabsTrigger
                  value="valuation"
                  className={FIELD_TAB}
                  disabled={!currentValuation}
                >
                  By valuation
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {byValuation ? (
              <div className="flex flex-col gap-5">
                <div className="flex items-baseline justify-between gap-4 border-b border-mark-ink pb-3 text-[1rem]">
                  <span className="font-semibold">Valuation today</span>
                  <span className="figures font-semibold">
                    {euro(currentValuation!)}
                  </span>
                </div>
                <div>
                  <Label htmlFor="future-valuation" className="text-[1rem]">
                    Valuation at the exit
                  </Label>
                  <Input
                    id="future-valuation"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={1000}
                    value={futureValuation}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      if (!isNaN(v) && v >= 0) setFutureValuation(v)
                    }}
                    className="mt-2 text-[1.25rem]"
                  />
                </div>
                <div className="flex items-baseline justify-between gap-4 text-[1rem]">
                  <span className="font-semibold">That is</span>
                  <span className="voice-figure text-[1.375rem] sm:text-[1.75rem]">
                    {multiple(effectiveMultiplier)} today
                  </span>
                </div>
              </div>
            ) : (
              <Ruler
                id="exit-multiple"
                label="Company valuation at the exit"
                display={
                  <>
                    <BlankNumber
                      label="Valuation multiple"
                      value={multiplier}
                      onCommit={setMultiplier}
                      format={(v) => decimal(v, 1)}
                      min={0.5}
                      max={20}
                      step={0.1}
                      minChars={3}
                    />
                    × today
                  </>
                }
                valueText={`${multiple(multiplier)} today's valuation`}
                value={positionFromMultiple(multiplier)}
                max={MULTIPLE_STEPS}
                onChange={(p) => setMultiplier(multipleFromPosition(p))}
                onStep={(direction) =>
                  setMultiplier(stepMultiple(multiplier, direction))
                }
                ticks={MULTIPLE_TICKS.map((t) => ({
                  at: positionFromMultiple(t) / MULTIPLE_STEPS,
                  label: `${t}×`,
                }))}
              />
            )}

            <div className="flex flex-col gap-3">
              <Ruler
                id="exit-dilution"
                label="Dilution from future funding rounds"
                display={
                  <>
                    <BlankNumber
                      label="Dilution in percent"
                      value={dilutionPercent}
                      onCommit={setDilutionPercent}
                      format={shares}
                      integer
                      min={0}
                      max={75}
                      step={1}
                      minChars={2}
                    />
                    %
                  </>
                }
                valueText={percent(dilutionPercent)}
                value={dilutionPercent}
                max={75}
                onChange={setDilutionPercent}
                ticks={DILUTION_TICKS.map((t) => ({
                  at: t / 75,
                  label: `${t}%`,
                }))}
              />
              {calculatedDilution != null && calculatedDilution > 0 && (
                <p className="text-[0.9375rem] leading-snug">
                  Your funding rounds add up to{" "}
                  {percentPrecise(calculatedDilution, 2)} so far.{" "}
                  <button
                    type="button"
                    className="text-link cursor-pointer font-semibold"
                    onClick={() =>
                      setDilutionPercent(Math.round(calculatedDilution))
                    }
                  >
                    Use that
                  </button>
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-6 lg:border-l lg:border-mark-ink lg:pl-10">
            <dl className="figures text-[1rem] lg:text-[1.0625rem]">
              <Row
                term="Net value today"
                value={euro(summary.currentNetValue)}
              />
              <Row
                term={`At ${multiple(effectiveMultiplier)}, before dilution`}
                value={euro(beforeDilution)}
              />
              <Row
                term={`Minus dilution of ${percent(dilutionPercent)}`}
                value={`−${euro(summary.dilutionImpact)}`}
              />
              <div className="mt-4 border-t-2 border-mark-ink pt-5">
                <dt className="text-[1rem] font-semibold">Net payout</dt>
                <dd className="mt-3">
                  <span
                    className="voice-figure fit-figure inline-block bg-mark-ink px-[0.12em] py-[0.08em] text-mark [--fig:clamp(2.5rem,5vw,4.25rem)]"
                    style={fitFigure(payout, 8)}
                  >
                    <RollingNumber value={payout} />
                  </span>
                  <p className="mt-4 max-w-[40ch] text-[0.9375rem] leading-snug">
                    {underwater
                      ? "Nothing at this valuation: the strike price is above the exit price per share."
                      : gain >= 0
                        ? `${euro(gain)} more than the ${euro(summary.currentNetValue)} your grants are worth today.`
                        : `${euro(-gain)} less than the ${euro(summary.currentNetValue)} your grants are worth today.`}
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <p className="mt-line max-w-[70ch] text-[0.8125rem] leading-relaxed">
          A simulation, not a forecast or advice. It assumes every grant has
          fully vested by the exit and shows values before tax.
        </p>
      </section>

      <div>
        <button
          type="button"
          className="text-link inline-flex cursor-pointer items-center gap-1.5 text-[0.9375rem] font-semibold"
          aria-expanded={infoOpen}
          onClick={() => setInfoOpen(!infoOpen)}
        >
          How valuation and dilution change what you get
          <ChevronDown
            strokeWidth={2.25}
            className={cn(
              "size-4 transition-transform duration-150",
              infoOpen && "rotate-180"
            )}
          />
        </button>
        {infoOpen && (
          <div className="mt-4 flex max-w-[62ch] flex-col gap-3 text-[0.9375rem] leading-relaxed text-ink-soft">
            <p>
              Your options give you the right to buy shares at a fixed{" "}
              <strong className="font-semibold text-ink">strike price</strong>.
              When the company's valuation rises, each share is worth more while
              your strike price stays the same. The difference is your gain.
            </p>
            <p>
              <strong className="font-semibold text-ink">Dilution</strong>{" "}
              happens when the company issues new shares, typically in a funding
              round. Your shares then stand for a smaller part of the company:
              it may be worth more overall, but your slice of it is smaller.
            </p>
            <p>
              If you own 1% and a round creates 20% new shares, your ownership
              drops to about 0.83%. The dilution ruler shows how this changes
              your payout.
            </p>
          </div>
        )}
      </div>

      <PotentialChart
        data={curve}
        multiplier={effectiveMultiplier}
        dilutionPercent={dilutionPercent}
      />
    </div>
  )
}

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-t border-mark-ink py-3">
      <dt>{term}</dt>
      <dd className="shrink-0 font-semibold">{value}</dd>
    </div>
  )
}
