import { OpenApp, REPO_URL, Wordmark } from "@/components/brand"
import { Mark } from "@/components/mark"
import { RollingNumber } from "@/components/rolling-number"
import { euro, shares } from "@/lib/format"
import { APP_URL } from "@/lib/handoff"
import { useAgreement } from "@/lib/terms"

// Every agreement ends with its signatures. The company signed when you
// joined; your line is the one that opens the app.
export function Signatures() {
  const { grant, summary, problem } = useAgreement()

  return (
    <section aria-labelledby="close-title" className="mx-auto max-w-[1320px] px-5 pb-[calc(var(--line)*3)] sm:px-8 lg:px-12">
      <div className="border-t border-ink pt-[calc(var(--line)*2)]">
        {!problem && (
          // The redline: what the agreement says, struck through, and what it means
          <p className="mb-[var(--line)] flex flex-wrap items-baseline gap-x-5 gap-y-2">
            <s className="redline voice-clause text-[clamp(1.375rem,2.6vw,2.25rem)] text-ink-muted no-underline">
              {shares(grant.shares)} Virtual Shares
            </s>
            <span className="sr-only">, in euros: </span>
            <span className="voice-figure text-[clamp(1.625rem,3vw,2.75rem)]">
              <RollingNumber value={euro(summary.vestedNet)} />
            </span>
            <span className="text-[0.9375rem] text-ink-soft">net, vested today</span>
          </p>
        )}

        <h2 id="close-title" className="voice-display text-[clamp(2.5rem,5vw,4.5rem)]">
          <span className="lg:block">Your agreement counts shares.</span>{" "}
          <span className="lg:block">
            VestWise counts <Mark sweep="scroll">euros.</Mark>
          </span>
        </h2>

        <div className="mt-[calc(var(--line)*2)] grid gap-y-[calc(var(--line)*1.25)] md:grid-cols-2 md:gap-x-16">
          <div>
            <p className="text-[0.9375rem] font-semibold">For the Company</p>
            <div className="mt-4 flex h-[4.25rem] items-end border-b border-ink pb-3">
              <span className="voice-clause text-[1.25rem] text-ink-muted">Signed when you joined</span>
            </div>
            <p className="mt-2 text-[0.875rem] text-ink-soft">Your employer</p>
          </div>
          <div>
            <p className="text-[0.9375rem] font-semibold">The Participant</p>
            <div className="mt-4 flex h-[4.25rem] items-end border-b border-ink pb-2">
              <OpenApp size="lg" />
            </div>
            <p className="mt-2 text-[0.875rem] text-ink-soft">You. Free, and no sign-up.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export function SiteFooter() {
  const { handoffUrl } = useAgreement()

  return (
    <footer className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
      <div className="flex flex-col gap-6 border-t border-ink py-8 md:flex-row md:items-start md:justify-between">
        <div>
          <Wordmark className="text-[1.125rem]" />
          <p className="mt-3 max-w-[56ch] text-[0.8125rem] leading-relaxed text-ink-soft">
            The agreement on this page is a sample for illustration. VestWise is a calculator,
            not legal, tax or investment advice.
          </p>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[0.875rem]">
          <li>
            <a href={handoffUrl ?? APP_URL} className="text-link">
              Open the app
            </a>
          </li>
          <li>
            <a href={REPO_URL} className="text-link">
              GitHub
            </a>
          </li>
          <li className="text-ink-soft">© {new Date().getFullYear()} VestWise</li>
        </ul>
      </div>
    </footer>
  )
}
