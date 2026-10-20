import { cn } from "../lib/cn"

// The name with its yellow bar: the one binding brand element
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[0.45em] font-extrabold tracking-[-0.02em] [font-stretch:112%]",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="inline-block h-[0.95em] w-[0.42em] shrink-0 bg-mark"
      />
      VestWise
    </span>
  )
}

// The bar on its own, where the name has no room (the app's icon rail)
export function WordmarkBar({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-[1.125rem] w-2 shrink-0 bg-mark",
        className
      )}
    />
  )
}
