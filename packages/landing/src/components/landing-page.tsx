import { useRef } from "react"
import { ExitClause } from "@/components/exit-clause"
import { GrantClause } from "@/components/grant-clause"
import { Letterhead, RunningHead } from "@/components/letterhead"
import { PrivacyClause } from "@/components/privacy-clause"
import { SiteFooter, Signatures } from "@/components/signatures"
import { VestingExhibit } from "@/components/vesting-exhibit"
import { AgreementProvider } from "@/lib/terms"

// The page is one document: a sample VSOP agreement, clause by clause, with
// VestWise's annotations in the margin.
export function LandingPage() {
  const heroEnd = useRef<HTMLDivElement>(null)

  return (
    <AgreementProvider>
      <a
        href="#main"
        className="btn btn-mark sr-only fixed top-3 left-3 z-50 focus:not-sr-only"
      >
        Skip to the agreement
      </a>
      <RunningHead heroEnd={heroEnd} />
      <Letterhead />
      <main id="main">
        <GrantClause heroEnd={heroEnd} />
        <VestingExhibit />
        <ExitClause />
        <PrivacyClause />
        <Signatures />
      </main>
      <SiteFooter />
    </AgreementProvider>
  )
}
