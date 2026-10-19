// Ported from packages/landing/src/components/rolling-number.tsx: keep in sync
import { useEffect, useRef, useState, type CSSProperties } from "react"
import { prefersReducedMotion } from "@/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

interface RollingNumberProps {
  /** The fully formatted figure, e.g. "€16,875" or "16.875 €" */
  value: string
  className?: string
  /** On first render, roll up from zeros after this many ms */
  introDelay?: number
  introDuration?: number
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]

function zeroed(value: string): string {
  return value.replace(/\d/g, "0")
}

// Every figure owns fixed digit slots and rolls digit by digit when it
// changes. CSS transitions keep it interruptible while someone is typing.
export function RollingNumber({
  value,
  className,
  introDelay,
  introDuration = 1200,
}: RollingNumberProps) {
  const [hasIntro] = useState(
    () => introDelay !== undefined && !prefersReducedMotion()
  )
  const [shown, setShown] = useState(() => (hasIntro ? zeroed(value) : value))
  const [intro, setIntro] = useState(hasIntro)
  const started = useRef(!hasIntro)
  const latest = useRef(value)

  useEffect(() => {
    latest.current = value
    if (started.current) setShown(value)
  }, [value])

  useEffect(() => {
    if (!hasIntro) return
    const start = window.setTimeout(() => {
      started.current = true
      setShown(latest.current)
    }, introDelay)
    const end = window.setTimeout(
      () => setIntro(false),
      (introDelay ?? 0) + introDuration + 500
    )
    return () => {
      window.clearTimeout(start)
      window.clearTimeout(end)
    }
  }, [hasIntro, introDelay, introDuration])

  const chars = [...shown]
  const digitCount = chars.filter((c) => /\d/.test(c)).length
  let digitIndex = 0

  return (
    <span className={cn("roll", className)} data-animate="true">
      <span className="sr-only">{value}</span>
      {chars.map((char, i) => {
        // Keyed from the right, so units stay put when the figure grows a digit
        const key = chars.length - i
        if (!/\d/.test(char)) {
          return (
            <span key={`c${key}`} className="roll-char" aria-hidden="true">
              {char}
            </span>
          )
        }
        const position = digitIndex++
        const style = {
          "--digit": Number(char),
          "--roll-duration": intro ? `${introDuration}ms` : "460ms",
          // Intro rolls left to right; edits cascade from the units up
          "--roll-delay": intro
            ? `${position * 70}ms`
            : `${(digitCount - 1 - position) * 18}ms`,
        } as CSSProperties
        return (
          <span key={`d${key}`} className="roll-slot" aria-hidden="true">
            <span className="roll-strip" style={style}>
              {DIGITS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        )
      })}
    </span>
  )
}
