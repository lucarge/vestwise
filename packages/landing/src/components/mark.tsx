import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface MarkProps {
  children: ReactNode
  /** "load" sweeps once on page load, "scroll" sweeps as the words are read */
  sweep?: "load" | "scroll" | "none"
  /** Delay before a load sweep, in ms */
  delay?: number
  className?: string
}

// The highlighter: one flat, full-strength field behind the words that matter
export function Mark({ children, sweep = "none", delay = 0, className }: MarkProps) {
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
