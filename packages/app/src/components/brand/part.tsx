import { useId, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PartProps {
  title?: ReactNode
  description?: ReactNode
  /** A control that belongs to the whole part, set right of its title */
  action?: ReactNode
  /** The heading level of the title */
  as?: "h2" | "h3"
  id?: string
  className?: string
  children: ReactNode
}

// A part of the document: it opens with a 1px ink rule, names itself in the
// label voice and keeps its content on the clause line. Where other apps
// stack cards, this one rules the sheet.
export function Part({
  title,
  description,
  action,
  as: Heading = "h2",
  id,
  className,
  children,
}: PartProps) {
  const headingId = useId()
  return (
    <section
      id={id}
      aria-labelledby={title ? headingId : undefined}
      className={cn("border-t border-ink pt-5", className)}
    >
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
          <div className="min-w-0">
            {title && (
              <Heading
                id={headingId}
                className="text-[0.9375rem] font-semibold"
              >
                {title}
              </Heading>
            )}
            {description && (
              <p className="mt-1 max-w-[60ch] text-[0.875rem] leading-snug text-ink-soft">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

interface SplitProps {
  /** The terms, or the inputs: left of the rule from 1024px */
  terms: ReactNode
  /** VestWise's answer: right of the rule from 1024px, under it before */
  answer: ReactNode
  ratio?: "8/4" | "6/6" | "7/5"
  /** The rule's colour, for a split on the highlighter field */
  rule?: string
  className?: string
}

const RATIOS = {
  "8/4": ["lg:col-span-8", "lg:col-span-4"],
  "7/5": ["lg:col-span-7", "lg:col-span-5"],
  "6/6": ["lg:col-span-6", "lg:col-span-6"],
} as const

// Terms left, answer right: the answer sits right of a 1px vertical rule
// from 1024px, and under a horizontal one on narrower screens
export function Split({
  terms,
  answer,
  ratio = "8/4",
  rule = "border-ink",
  className,
}: SplitProps) {
  const [left, right] = RATIOS[ratio]
  return (
    <div
      className={cn("grid gap-y-line lg:grid-cols-12 lg:gap-x-12", className)}
    >
      <div className={cn("min-w-0", left)}>{terms}</div>
      <div
        className={cn(
          "min-w-0 border-t pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10",
          rule,
          right
        )}
      >
        {answer}
      </div>
    </div>
  )
}
