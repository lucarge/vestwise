import { Children, type ReactNode } from "react"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

interface ScrollAnimateProps {
  children: ReactNode
  className?: string
  delay?: number
  /** Reveal each child in turn, this many ms apart, from a single trigger */
  stagger?: number
}

export function ScrollAnimate({ children, className, delay = 0, stagger }: ScrollAnimateProps) {
  // A staggered group can include a tall chart card, so it starts as soon as
  // its top edge is in view rather than waiting for 15% of the whole group
  const { ref, inView } = useInView({
    threshold: stagger === undefined ? 0.15 : 0,
    triggerOnce: true,
  })

  const revealClassName = cn(
    "transition-[opacity,translate] duration-500 ease-out",
    inView
      ? "opacity-100 translate-y-0"
      : "opacity-0 translate-y-3 motion-reduce:translate-y-0"
  )

  if (stagger === undefined) {
    return (
      <div
        ref={ref}
        className={cn(revealClassName, className)}
        style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      >
        {children}
      </div>
    )
  }

  return (
    <div ref={ref} className={className}>
      {Children.toArray(children).map((child, i) => (
        <div
          key={i}
          className={revealClassName}
          style={{ transitionDelay: `${delay + i * stagger}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}
