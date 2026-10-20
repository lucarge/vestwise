import { Mark, euro, shares } from "@vestwise/brand"
import { Part } from "@/components/brand/part"
import type { YearlySummary as YearlySummaryData } from "@/types/vesting"

interface YearlySummaryProps {
  data: YearlySummaryData[]
}

// The yearly ledger: what vests in each calendar year, this year marked
export function YearlySummary({ data }: YearlySummaryProps) {
  const thisYear = new Date().getFullYear()

  return (
    <Part
      title="Vesting by year"
      description="Shares vesting in each calendar year, and what they are worth."
    >
      <ul
        aria-label="Shares vesting per calendar year"
        className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))]"
      >
        {data.map((row) => (
          <li key={row.year} className="border-t border-ink pt-3">
            <p className="text-[0.9375rem] font-semibold">
              {row.year === thisYear ? (
                <Mark>{row.year}, this year</Mark>
              ) : (
                row.year
              )}
            </p>
            <p className="voice-figure mt-2 text-[1.75rem]">
              {shares(Math.round(row.sharesVesting))}
            </p>
            <p className="figures mt-1 text-[0.875rem] leading-snug text-ink-soft">
              shares, {euro(row.netValueVesting)} net, {euro(row.valueVesting)}{" "}
              in value
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-[0.8125rem] leading-snug text-ink-muted">
        Net value is value minus strike price. Value follows the valuation that
        applied when each grant was made.
      </p>
    </Part>
  )
}
