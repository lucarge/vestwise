import { ArrowUpRight } from "lucide-react"
import { REPO_URL } from "@/components/brand"

// § 4 reads like the rest of the agreement: sub-clauses in the agreement's
// voice, each glossed by VestWise in the margin
const SUBCLAUSES = [
  {
    clause:
      "The Participant may use VestWise without creating an account or giving an email address.",
    gloss: "No account.",
    detail: "Open it and start.",
  },
  {
    clause:
      "Subject to 4.3, grants and valuations are stored in the Participant’s own browser. VestWise has no server that could receive them.",
    gloss: "No server.",
    detail: "VestWise never uploads them.",
  },
  {
    clause:
      "The Participant may export all data to a file at any time, or connect a file that is updated after every change (in Chrome and Edge), for example inside an iCloud Drive or Google Drive folder.",
    gloss: "Backups you own.",
    detail: "The file is yours, wherever you keep it.",
  },
  {
    clause: "The source code of VestWise is published under the MIT license.",
    gloss: "Open source.",
    detail: "Check every line yourself.",
    link: { href: REPO_URL, label: "Read the code on GitHub" },
  },
]

export function PrivacyClause() {
  return (
    <section
      id="privacy"
      aria-labelledby="privacy-title"
      className="mx-auto max-w-[1320px] scroll-mt-16 px-5 py-[calc(var(--line)*3)] sm:px-8 lg:px-12"
    >
      <h2 id="privacy-title" className="voice-display max-w-[16ch] text-[clamp(2.25rem,4.6vw,4rem)]">
        VestWise never sees your numbers.
      </h2>
      <p className="voice-clause read-focus mt-[var(--line)] max-w-[52ch] text-[1.125rem] leading-[calc(var(--line)*0.85)] lg:text-[1.3125rem]">
        <span className="font-semibold">§ 4 Data protection.</span> The figures entered by the
        Participant are processed on the Participant’s own device.
      </p>

      <ol className="mt-[var(--line)]">
        {SUBCLAUSES.map((item, i) => (
          <li
            key={item.gloss}
            className="grid gap-y-3 border-t border-ink py-5 lg:grid-cols-12 lg:gap-x-12 lg:py-6"
          >
            <p className="voice-clause read-focus text-[1.0625rem] leading-relaxed lg:col-span-8 lg:text-[1.25rem]">
              <span className="font-semibold">4.{i + 1}</span> {item.clause}
            </p>
            <p className="text-[1rem] leading-snug text-pretty lg:col-span-4 lg:border-l lg:border-ink lg:pl-10">
              <span className="font-bold [font-stretch:108%]">{item.gloss}</span>{" "}
              <span className="text-ink-soft">{item.detail}</span>
              {item.link && (
                <a
                  href={item.link.href}
                  className="text-link mt-2 flex w-fit items-center gap-0.5 font-semibold"
                >
                  {item.link.label}
                  <ArrowUpRight aria-hidden="true" strokeWidth={2} className="size-4" />
                </a>
              )}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
