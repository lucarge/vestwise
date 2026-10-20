import {
  DILUTION_TICKS,
  MULTIPLE_STEPS,
  MULTIPLE_TICKS,
  RollingNumber,
  Ruler,
  euro,
  fitFigure,
  multiple,
  multipleFromPosition,
  percent,
  positionFromMultiple,
  shares,
  stepMultiple,
} from "@vestwise/brand"
import { useAgreement } from "@/lib/terms"

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
              max={MULTIPLE_STEPS}
              onChange={(p) => setMultiple(multipleFromPosition(p))}
              onStep={(direction) => setMultiple(stepMultiple(m, direction))}
              ticks={MULTIPLE_TICKS.map((t) => ({
                at: positionFromMultiple(t) / MULTIPLE_STEPS,
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
