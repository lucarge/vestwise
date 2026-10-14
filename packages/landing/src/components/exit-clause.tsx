import type { CSSProperties } from "react"
import { RollingNumber } from "@/components/rolling-number"
import { euro, multiple, percent, shares } from "@/lib/format"
import { MULTIPLE_RANGE, useAgreement } from "@/lib/terms"
import { fitFigure } from "@/lib/utils"

// The multiple runs on a log scale, so 1x to 3x gets as much travel as 5x to 20x
const SPAN = Math.log(MULTIPLE_RANGE.max / MULTIPLE_RANGE.min)
const STEPS = 1000

function multipleFromPosition(position: number): number {
  const raw = MULTIPLE_RANGE.min * Math.exp((position / STEPS) * SPAN)
  return Math.round(raw * 10) / 10
}

function positionFromMultiple(value: number): number {
  return Math.round((Math.log(value / MULTIPLE_RANGE.min) / SPAN) * STEPS)
}

// One arrow press always moves to the next figure a person would say out
// loud; single track steps are too fine to change the rounded multiple
function stepMultiple(value: number, direction: 1 | -1): number {
  const size = (v: number) => (v < 3 ? 0.1 : v < 10 ? 0.5 : 1)
  const step = direction === 1 ? size(value) : size(value - 0.01)
  const next = Math.round((value + direction * step) / step) * step
  const clamped = Math.min(MULTIPLE_RANGE.max, Math.max(MULTIPLE_RANGE.min, next))
  return Math.round(clamped * 10) / 10
}

const MULTIPLE_TICKS = [0.5, 1, 2, 3, 5, 10, 20]
const DILUTION_TICKS = [0, 25, 50, 75]

export function ExitClause() {
  const { exit, multiple: m, setMultiple, dilution, setDilution, totalShares, problem } = useAgreement()
  const underwater = exit.grossAtExit < exit.strikeCost
  const gain = exit.net - exit.todayNet

  return (
    // Full bleed on paper; in dark mode the field is held to the sheet's
    // measure so a night-reading page does not glare
    <section id="exit" aria-labelledby="exit-title" className="exit-field scroll-mt-14 bg-mark text-mark-ink dark:bg-transparent">
      <div className="mx-auto max-w-[1320px] dark:px-5 dark:sm:px-8 dark:lg:px-12">
      <div className="px-5 py-[calc(var(--line)*2.5)] sm:px-8 lg:px-12 lg:py-[calc(var(--line)*3)] dark:bg-mark">
        <p className="voice-clause max-w-[62ch] text-[1.125rem] leading-[calc(var(--line)*0.85)] lg:text-[1.3125rem]">
          <span className="font-semibold">§ 3 Exit.</span> On an Exit, the Company pays the
          Participant, for each vested Virtual Share, the price per share at the Exit minus the
          Strike Price.
        </p>

        <h2 id="exit-title" className="voice-display mt-[var(--line)] max-w-[14ch] text-[clamp(2.5rem,5.6vw,5rem)]">
          What would an exit pay you?
        </h2>

        <div className="mt-[calc(var(--line)*1.25)] grid gap-y-[calc(var(--line)*1.25)] lg:grid-cols-12 lg:gap-x-12">
          <div className="flex flex-col gap-[var(--line)] lg:col-span-6">
            <Ruler
              id="exit-multiple"
              label="Company valuation at the exit"
              display={`${multiple(m)} today`}
              valueText={`${multiple(m)} today's valuation`}
              value={positionFromMultiple(m)}
              max={STEPS}
              onChange={(p) => setMultiple(multipleFromPosition(p))}
              onStep={(direction) => setMultiple(stepMultiple(m, direction))}
              ticks={MULTIPLE_TICKS.map((t) => ({
                at: positionFromMultiple(t) / STEPS,
                label: `${t}×`,
              }))}
            />
            <Ruler
              id="exit-dilution"
              label="Dilution from future funding rounds"
              display={percent(dilution)}
              valueText={percent(dilution)}
              value={dilution}
              max={75}
              onChange={setDilution}
              ticks={DILUTION_TICKS.map((t) => ({ at: t / 75, label: `${t}%` }))}
            />
            <p className="max-w-[46ch] text-[0.9375rem] leading-relaxed">
              In the app, VestWise works out dilution for you from the funding rounds you enter.
            </p>
          </div>

          <div className="lg:col-span-6 lg:border-l lg:border-mark-ink lg:pl-10">
            {problem ? (
              <p className="text-[1.0625rem] font-semibold">Fill in the blanks in § 1 to see the payout.</p>
            ) : (
              <dl className="figures text-[1rem] lg:text-[1.0625rem]">
                <Row term={`Your ${shares(totalShares)} shares at ${multiple(m)} today's value`} value={euro(exit.grossAtExit)} />
                <Row term="Minus the strike price" value={`−${euro(exit.strikeCost)}`} />
                <Row term={`Minus dilution of ${percent(dilution)}`} value={`−${euro(exit.dilutionCost)}`} />
                <div className="mt-4 border-t-2 border-mark-ink pt-5">
                  <dt className="text-[1rem] font-semibold">Net payout</dt>
                  <dd className="mt-3">
                    <span
                      className="voice-figure fit-figure inline-block bg-mark-ink px-[0.12em] py-[0.08em] text-mark [--fig:clamp(3rem,6vw,5.25rem)]"
                      style={fitFigure(euro(exit.net), 8)}
                    >
                      <RollingNumber value={euro(exit.net)} />
                    </span>
                    <p className="mt-4 text-[0.9375rem]">
                      {underwater
                        ? "Nothing at this valuation: the strike price is higher than the exit price per share."
                        : gain >= 0
                          ? `${euro(gain)} more than the ${euro(exit.todayNet)} the grant is worth today.`
                          : `${euro(-gain)} less than the ${euro(exit.todayNet)} the grant is worth today.`}
                    </p>
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </div>

        <p className="mt-[calc(var(--line)*1.25)] max-w-[70ch] text-[0.8125rem] leading-relaxed">
          A simulation, not a forecast or advice. It assumes the grant has fully vested by the exit
          and shows values before tax.
        </p>
      </div>
      </div>
    </section>
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

interface RulerProps {
  id: string
  label: string
  display: string
  valueText: string
  value: number
  max: number
  onChange: (value: number) => void
  /** Replaces the native arrow-key step, for tracks that are not linear */
  onStep?: (direction: 1 | -1) => void
  ticks: { at: number; label: string }[]
}

// A range input drawn as a ruler. Ticks sit where the thumb's centre travels,
// which is inset by half the thumb's width at either end.
function Ruler({ id, label, display, valueText, value, max, onChange, onStep, ticks }: RulerProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-[1rem] font-semibold">
          {label}
        </label>
        <output htmlFor={id} className="voice-figure shrink-0 text-[1.375rem] whitespace-nowrap sm:text-[1.75rem]">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="ruler mt-2"
        min={0}
        max={max}
        step={1}
        value={value}
        aria-valuetext={valueText}
        onChange={(event) => onChange(Number(event.target.value))}
        onKeyDown={(event) => {
          if (!onStep) return
          const up = event.key === "ArrowRight" || event.key === "ArrowUp"
          const down = event.key === "ArrowLeft" || event.key === "ArrowDown"
          if (up || down) {
            event.preventDefault()
            onStep(up ? 1 : -1)
          }
        }}
      />
      <div aria-hidden="true" className="relative h-9">
        {ticks.map((tick) => (
          <span
            key={tick.label}
            className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `calc(0.3125rem + ${tick.at} * (100% - 0.625rem))` } as CSSProperties}
          >
            <span className="h-2 w-px bg-mark-ink" />
            <span className="figures mt-1 text-[0.75rem]">{tick.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
