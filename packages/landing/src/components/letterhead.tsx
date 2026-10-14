import { useEffect, useState, type CSSProperties, type RefObject } from "react"
import { ArrowUpRight } from "lucide-react"
import { OpenApp, REPO_URL, Wordmark } from "@/components/brand"
import { RollingNumber } from "@/components/rolling-number"
import { euro, shares } from "@/lib/format"
import { useAgreement } from "@/lib/terms"

const LINKS = [
  { href: "#vesting", label: "Vesting" },
  { href: "#exit", label: "Exit" },
  { href: "#privacy", label: "Privacy" },
]

export function Letterhead() {
  return (
    <header className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
      <div className="flex h-16 items-center justify-between gap-6 lg:h-[4.5rem]">
        <a href="/" aria-label="VestWise, home" className="anim-appear text-[1.3125rem]" style={{ "--d": "100ms" } as CSSProperties}>
          <Wordmark />
        </a>
        <nav aria-label="Primary" className="anim-appear flex items-center gap-7" style={{ "--d": "250ms" } as CSSProperties}>
          <ul className="hidden items-center gap-7 text-[0.9375rem] font-medium md:flex">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="text-link decoration-transparent hover:decoration-current">
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a href={REPO_URL} className="text-link inline-flex items-center gap-1 decoration-transparent hover:decoration-current">
                GitHub
                <ArrowUpRight aria-hidden="true" strokeWidth={2} className="size-4" />
              </a>
            </li>
          </ul>
          <OpenApp />
        </nav>
      </div>
      <div aria-hidden="true" className="anim-rule h-px bg-ink" style={{ "--d": "0ms" } as CSSProperties} />
    </header>
  )
}

// Documents repeat a running head on every page; this one carries the
// visitor's own figure, so it stays in view while they read the clauses
export function RunningHead({ heroEnd }: { heroEnd: RefObject<HTMLElement | null> }) {
  const { summary, grant, problem } = useAgreement()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = heroEnd.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [heroEnd])

  return (
    <div
      className="running-head fixed inset-x-0 top-0 z-40 border-b border-ink bg-paper"
      data-visible={visible}
      aria-hidden={!visible}
    >
      <div className="mx-auto flex h-14 max-w-[1320px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <a href="#top" tabIndex={visible ? 0 : -1} aria-label="Back to top" className="text-[1.0625rem]">
          <Wordmark />
        </a>
        <p className="hidden min-w-0 truncate text-[0.9375rem] text-ink-soft sm:block">
          {problem ? (
            "Check the blanks in § 1"
          ) : (
            <>
              Your {shares(grant.shares)} shares:{" "}
              <span className="figures font-bold text-ink">
                <RollingNumber value={euro(summary.vestedNet)} />
              </span>{" "}
              vested today
            </>
          )}
        </p>
        <OpenApp className="h-10" />
      </div>
    </div>
  )
}
