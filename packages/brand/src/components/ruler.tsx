import type { CSSProperties, ReactNode } from "react"

interface RulerProps {
  id: string
  label: string
  /** The readout beside the label; a figure, or an editable blank */
  display: ReactNode
  valueText: string
  value: number
  max: number
  onChange: (value: number) => void
  /** Replaces the native arrow-key step, for tracks that are not linear */
  onStep?: (direction: 1 | -1) => void
  ticks: { at: number; label: string }[]
}

// A range input drawn as a ruler. Ticks sit where the thumb's centre travels,
// which is inset by half the thumb's width at either end. The scale maths for
// a valuation multiple live in ../lib/ruler-scale.ts.
export function Ruler({
  id,
  label,
  display,
  valueText,
  value,
  max,
  onChange,
  onStep,
  ticks,
}: RulerProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-[1rem] font-semibold">
          {label}
        </label>
        <output
          htmlFor={id}
          className="voice-figure shrink-0 text-[1.375rem] whitespace-nowrap sm:text-[1.75rem]"
        >
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="ruler mt-2"
        min={0}
        max={max}
        step={1}
        value={value}
        aria-valuetext={valueText}
        onChange={(event) => onChange(Number(event.target.value))}
        onKeyDown={(event) => {
          if (!onStep) return
          const up = event.key === "ArrowRight" || event.key === "ArrowUp"
          const down = event.key === "ArrowLeft" || event.key === "ArrowDown"
          if (up || down) {
            event.preventDefault()
            onStep(up ? 1 : -1)
          }
        }}
      />
      <div aria-hidden="true" className="relative h-9">
        {ticks.map((tick) => (
          <span
            key={tick.label}
            className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
            style={
              {
                left: `calc(0.3125rem + ${tick.at} * (100% - 0.625rem))`,
              } as CSSProperties
            }
          >
            <span className="h-2 w-px bg-current" />
            <span className="figures mt-1 text-[0.75rem]">{tick.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
