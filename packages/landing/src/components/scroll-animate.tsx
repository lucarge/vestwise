import type { ReactNode } from "react"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"

interface ScrollAnimateProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function ScrollAnimate({ children, className, delay = 0 }: ScrollAnimateProps) {
  const { ref, inView } = useInView({ threshold: 0.15, triggerOnce: true })

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,translate] duration-500 ease-out",
        inView
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-3 motion-reduce:translate-y-0",
        className
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
