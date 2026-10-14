import { useState, type KeyboardEvent } from "react"
import { ChevronDown } from "lucide-react"
import { parseAmount } from "@/lib/format"

interface BlankNumberProps {
  /** Accessible name, e.g. "Number of virtual shares" */
  label: string
  value: number
  onCommit: (value: number) => void
  format: (value: number) => string
  min?: number
  max?: number
  step?: number
  integer?: boolean
  minChars?: number
  describedBy?: string
}

// A blank in the agreement that is really an input. Every valid keystroke
// updates the whole document; the text is tidied into the visitor's number
// format when they leave the field.
export function BlankNumber({
  label,
  value,
  onCommit,
  format,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  integer = false,
  minChars = 2,
  describedBy,
}: BlankNumberProps) {
  // What the visitor is typing exists only while the field has focus;
  // otherwise the blank shows the committed value in their number format
  const [draft, setDraft] = useState<string | null>(null)
  const [invalid, setInvalid] = useState(false)
  const text = draft ?? format(value)

  function accept(raw: string) {
    setDraft(raw)
    const parsed = parseAmount(raw)
    const ok =
      parsed !== null && parsed >= min && parsed <= max && (!integer || Number.isInteger(parsed))
    setInvalid(!ok)
    if (ok) onCommit(parsed)
  }

  function nudge(direction: 1 | -1, large: boolean) {
    const next = Math.min(max, Math.max(min, value + direction * step * (large ? 10 : 1)))
    const rounded = integer ? Math.round(next) : Math.round(next * 100) / 100
    setInvalid(false)
    setDraft(format(rounded))
    onCommit(rounded)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault()
      nudge(event.key === "ArrowUp" ? 1 : -1, event.shiftKey)
    } else if (event.key === "Enter") {
      event.currentTarget.blur()
    }
  }

  return (
    <input
      type="text"
      className="blank"
      aria-label={label}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      inputMode={integer ? "numeric" : "decimal"}
      autoComplete="off"
      spellCheck={false}
      enterKeyHint="done"
      value={text}
      size={Math.max(text.length, minChars)}
      style={{ width: `calc(${Math.max(text.length, minChars)}ch + 0.5em)` }}
      onFocus={(event) => {
        setDraft(format(value))
        event.currentTarget.select()
      }}
      onBlur={() => {
        setDraft(null)
        setInvalid(false)
      }}
      onChange={(event) => accept(event.target.value)}
      onKeyDown={onKeyDown}
    />
  )
}

interface BlankSelectProps<T extends string> {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

export function BlankSelect<T extends string>({ label, value, options, onChange }: BlankSelectProps<T>) {
  const selected = options.find((o) => o.value === value)?.label ?? ""
  return (
    <span className="relative inline-block">
      <select
        className="blank blank-select peer"
        aria-label={label}
        value={value}
        style={{ width: `calc(${selected.length}ch + 1.5em)` }}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        strokeWidth={2.25}
        className="pointer-events-none absolute top-1/2 right-[0.3em] size-[0.6em] -translate-y-[40%] peer-focus:text-mark-ink"
      />
    </span>
  )
}
