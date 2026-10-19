// Ported from packages/landing/src/components/mark.tsx (without the scroll
// sweep, which belongs to a page that is read): keep in sync
import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface MarkProps {
  children: ReactNode
  /** "load" sweeps once when the mark first renders */
  sweep?: "load" | "none"
  /** Delay before a load sweep, in ms */
  delay?: number
  className?: string
}

// The highlighter: one flat, full-strength field behind the words that matter
export function Mark({
  children,
  sweep = "none",
  delay = 0,
  className,
}: MarkProps) {
  return (
    <span className={cn("mark", className)}>
      {children}
      <span
        className="mark-fill"
        data-sweep={sweep}
        style={{ "--d": `${delay}ms` } as CSSProperties}
        aria-hidden="true"
      >
        {children}
      </span>
    </span>
  )
}
