// VestWise's brand primitives, consumed as sources by the landing and the app.
// The matching styles live in ./brand.css, imported by each package's
// index.css after "tailwindcss".

export { Wordmark, WordmarkBar } from "./components/wordmark"
export { Mark } from "./components/mark"
export { RollingNumber } from "./components/rolling-number"
export { BlankNumber, BlankSelect } from "./components/blank"
export { Ruler } from "./components/ruler"
export {
  DILUTION_TICKS,
  MULTIPLE_RANGE,
  MULTIPLE_STEPS,
  MULTIPLE_TICKS,
  multipleFromPosition,
  positionFromMultiple,
  stepMultiple,
} from "./lib/ruler-scale"
export {
  prefersReducedMotion,
  useReducedMotion,
} from "./hooks/use-reduced-motion"
export {
  LOCALE,
  amount,
  decimal,
  euro,
  euroCompact,
  euroPrecise,
  formatDate,
  formatDateLong,
  month,
  multiple,
  parseAmount,
  percent,
  percentPrecise,
  shares,
  shortMonth,
} from "./lib/format"
export { fitFigure } from "./lib/fit-figure"
