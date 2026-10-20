import { useCallback, useState } from "react"

// Width of an element, kept current with a ResizeObserver. Returns a callback
// ref so it also works for elements that mount later.
export function useElementWidth<T extends HTMLElement>() {
  const [width, setWidth] = useState(0)
  const [observer] = useState(
    () =>
      new ResizeObserver(([entry]) => {
        setWidth(Math.round(entry.contentRect.width))
      }),
  )

  const ref = useCallback(
    (node: T | null) => {
      observer.disconnect()
      if (node) {
        setWidth(Math.round(node.getBoundingClientRect().width))
        observer.observe(node)
      }
    },
    [observer],
  )

  return { ref, width }
}
