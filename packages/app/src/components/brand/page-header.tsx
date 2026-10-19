import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  lede?: ReactNode
  /** The page's one primary action, set right of the title */
  action?: ReactNode
  children?: ReactNode
}

// A page opens in the display voice, at a fixed size: this is a product, not
// a poster
export function PageHeader({ title, lede, action, children }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
      <div className="min-w-0">
        <h1 className="voice-display text-[2rem] lg:text-[2.25rem]">{title}</h1>
        {lede && (
          <p className="mt-3 max-w-[52ch] text-[1rem] leading-relaxed text-ink-soft lg:text-[1.0625rem]">
            {lede}
          </p>
        )}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}
