import type { CSSProperties } from "react"

// A display figure is sized for a typical amount; anything longer (a large
// grant, a high multiple) shrinks to stay inside its column. Pairs with the
// .fit-figure class, which reads --fit.
export function fitFigure(text: string, designedFor: number): CSSProperties {
  return {
    "--fit": Math.min(1, designedFor / Math.max(designedFor, text.length)),
  } as CSSProperties
}
