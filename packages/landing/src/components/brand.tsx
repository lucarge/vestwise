import { ArrowRight } from "lucide-react"
import { APP_URL } from "@/lib/handoff"
import { useAgreement } from "@/lib/terms"
import { cn } from "@/lib/utils"

export const REPO_URL = "https://github.com/lucarge/vestwise"

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[0.45em] font-extrabold tracking-[-0.02em] [font-stretch:112%]", className)}>
      <span aria-hidden="true" className="inline-block h-[0.95em] w-[0.42em] bg-mark" />
      VestWise
    </span>
  )
}

interface OpenAppProps {
  className?: string
  size?: "md" | "lg"
  /** Ink button for use on top of the highlighter field */
  tone?: "mark" | "ink"
}

// Every way into the app carries the visitor's edited terms, when the app can take them
export function OpenApp({ className, size = "md", tone = "mark" }: OpenAppProps) {
  const { handoffUrl } = useAgreement()
  return (
    <a
      href={handoffUrl ?? APP_URL}
      className={cn("btn", tone === "mark" ? "btn-mark" : "btn-ink", size === "lg" && "btn-lg", className)}
    >
      Open the app
      <ArrowRight aria-hidden="true" strokeWidth={2.25} className="btn-arrow size-[1.1em]" />
    </a>
  )
}
