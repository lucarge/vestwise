import { useMemo, type CSSProperties, type RefObject } from "react"
import { ArrowDown } from "lucide-react"
import { BlankNumber, BlankSelect } from "@/components/blank"
import { OpenApp } from "@/components/brand"
import { Mark } from "@/components/mark"
import { RollingNumber } from "@/components/rolling-number"
import { amount, euro, month, multiple, percent, shares } from "@/lib/format"
import { useAgreement } from "@/lib/terms"
import { fitFigure } from "@/lib/utils"
import { addMonths, startOfMonth, type Schedule } from "@/lib/vesting"

const SCHEDULES: { value: Schedule; label: string }[] = [
  { value: "monthly", label: "monthly" },
  { value: "quarterly", label: "quarterly" },
  { value: "yearly", label: "yearly" },
]

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function useStartOptions(today: Date) {
  return useMemo(() => {
    const first = addMonths(startOfMonth(today), -120)
    return Array.from({ length: 145 }, (_, i) => {
      const date = addMonths(first, i)
      return { value: monthKey(date), label: month(date), date }
    })
  }, [today])
}

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties

export function GrantClause({ heroEnd }: { heroEnd: RefObject<HTMLDivElement | null> }) {
  const { grant, setGrant, resetGrant, isSample, handoffUrl, summary, problem, today, exit, multiple: m, dilution } =
    useAgreement()
  const startOptions = useStartOptions(today)
  const vested = euro(summary.vestedNet)
  const atExit = euro(exit.net)

  return (
    <section id="top" aria-labelledby="hero-title" className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
      <h1
        id="hero-title"
        className="hero-title voice-display mt-[calc(var(--line)*1.25)] max-w-[16ch] text-[clamp(3.25rem,8.2vw,7.5rem)]"
      >
        <span className="anim-line" style={delay(120)}>
          <span>Put a real number</span>
        </span>{" "}
        <span className="anim-line" style={delay(220)}>
          <span>
            on your{" "}
            <Mark sweep="load" delay={850}>
              VSOP.
            </Mark>
          </span>
        </span>
      </h1>

      <p
        className="anim-fade mt-6 max-w-[40ch] text-[1.0625rem] leading-relaxed text-ink-soft lg:max-w-none lg:text-[1.1875rem]"
        style={delay(350)}
      >
        Type in the terms of your grant. VestWise turns them into euros.
      </p>

      <div className="mt-[calc(var(--line)*1.25)] grid gap-y-[var(--line)] lg:mt-[var(--line)] lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-12">
        <div className="anim-fade lg:col-span-8 lg:row-start-1" style={delay(420)}>
          <p className="voice-clause text-[1.1875rem] leading-[var(--line)] lg:text-[1.625rem]">
            <span className="font-semibold">§ 1 Grant</span>{" "}
            <span className="text-ink-muted">({isSample ? "sample terms" : "your terms"}).</span> The
            Company grants the Participant{" "}
            <BlankNumber
              label="Number of virtual shares"
              value={grant.shares}
              onCommit={(v) => setGrant({ shares: v })}
              format={shares}
              min={1}
              max={100_000_000}
              step={100}
              minChars={3}
              describedBy="grant-status"
            />{" "}
            Virtual Shares, valued at EUR{" "}
            <BlankNumber
              label="Value per share in euros"
              value={grant.valuePerShare}
              onCommit={(v) => setGrant({ valuePerShare: v })}
              format={amount}
              min={0}
              max={10_000_000}
              step={0.25}
              describedBy="grant-status"
            />{" "}
            per share, at a Strike Price of EUR{" "}
            <BlankNumber
              label="Strike price per share in euros"
              value={grant.strike}
              onCommit={(v) => setGrant({ strike: v })}
              format={amount}
              min={0}
              max={10_000_000}
              step={0.25}
              describedBy="grant-status"
            />{" "}
            per share. The Virtual Shares vest{" "}
            <BlankSelect
              label="Vesting schedule"
              value={grant.schedule}
              options={SCHEDULES}
              onChange={(schedule) => setGrant({ schedule })}
            />{" "}
            over{" "}
            <BlankNumber
              label="Vesting period in months"
              value={grant.periodMonths}
              onCommit={(v) => setGrant({ periodMonths: v })}
              format={shares}
              integer
              min={1}
              max={240}
              describedBy="grant-status"
            />{" "}
            months, starting{" "}
            <BlankSelect
              label="Vesting start month"
              value={monthKey(grant.start)}
              options={startOptions}
              onChange={(key) => {
                const option = startOptions.find((o) => o.value === key)
                if (option) setGrant({ start: option.date })
              }}
            />
            , after a Cliff of{" "}
            <BlankNumber
              label="Cliff in months"
              value={grant.cliffMonths}
              onCommit={(v) => setGrant({ cliffMonths: v })}
              format={shares}
              integer
              min={0}
              max={239}
              describedBy="grant-status"
            />{" "}
            months.
          </p>
        </div>

        {/* The Participant's signature line carries the primary action */}
        <div className="anim-fade lg:col-span-8 lg:row-start-2 lg:self-start" style={delay(560)}>
          <div className="flex h-[4.25rem] items-end gap-x-6 border-b border-ink pb-2">
            <OpenApp size="lg" />
            {!isSample && (
              <button
                type="button"
                onClick={resetGrant}
                className="text-link mb-3 cursor-pointer text-[0.9375rem] font-medium text-ink-soft"
              >
                Reset to the sample terms
              </button>
            )}
          </div>
          <p className="mt-2 text-[0.875rem] text-ink-soft">
            {handoffUrl ? "The Participant. The app opens with these terms filled in." : "The Participant"}
          </p>
        </div>

        <aside
          aria-label="What these terms are worth"
          className="anim-fade border-t border-ink pt-6 max-lg:row-start-2 lg:col-span-4 lg:col-start-9 lg:row-span-2 lg:row-start-1 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10"
          style={delay(500)}
        >
          <p className="text-[0.9375rem] font-medium">Net value vested today</p>

          {problem ? (
            <p id="grant-status" role="status" className="mt-3 max-w-[30ch] text-[1.0625rem] leading-snug font-semibold">
              {problem}
            </p>
          ) : (
            <>
              <p
                className="voice-figure fit-figure mt-3 [--fig:clamp(3rem,5.2vw,4.75rem)]"
                style={fitFigure(vested, 7)}
              >
                <Mark sweep="load" delay={1000}>
                  <RollingNumber value={vested} introDelay={900} />
                </Mark>
              </p>
              <p id="grant-status" role="status" className="sr-only">
                Net value vested today: {vested}
              </p>
              <p className="mt-4 max-w-[34ch] text-[0.9375rem] leading-snug text-ink-soft">
                <span className="figures font-semibold text-ink">
                  <RollingNumber value={shares(Math.round(summary.vestedShares))} />
                </span>{" "}
                of {shares(grant.shares)} shares. Fully vested {month(summary.fullyVestedDate)}.
              </p>

              <a href="#exit" className="group mt-[var(--line)] block border-t border-ink pt-4">
                <span
                  className="voice-figure fit-figure block [--fig:1.75rem] lg:[--fig:2rem]"
                  style={fitFigure(atExit, 9)}
                >
                  <RollingNumber value={atExit} />
                </span>
                <span className="mt-1.5 flex items-center gap-1.5 text-[0.9375rem] leading-snug text-ink-soft">
                  at a {multiple(m)} exit, after {percent(dilution)} dilution
                  <ArrowDown
                    aria-hidden="true"
                    strokeWidth={2}
                    className="size-4 text-ink transition-transform duration-150 ease-out group-hover:translate-y-0.5"
                  />
                </span>
              </a>

              <p className="mt-[var(--line)] text-[0.8125rem] leading-snug text-ink-muted">
                {summary.underwater
                  ? "The strike price is above the value per share, so the grant is underwater for now."
                  : "Net value is the value of the shares minus the strike price, before tax."}
              </p>
            </>
          )}
        </aside>
      </div>

      <div ref={heroEnd} aria-hidden="true" className="h-[var(--line)]" />
    </section>
  )
}
