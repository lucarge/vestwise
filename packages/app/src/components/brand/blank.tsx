// BlankNumber and BlankSelect are ported from
// packages/landing/src/components/blank.tsx: keep in sync. BlankDate is the
// app's own: a blank that opens the calendar.
import { useState, type KeyboardEvent } from "react"
import { ChevronDown } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatDate, parseAmount } from "@/lib/format"

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
  /** A problem the surrounding form found with the committed value */
  invalid?: boolean
  className?: string
}

// A blank in the agreement that is really an input. Every valid keystroke
// updates the whole document; the text is tidied into the reader's number
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
  invalid = false,
  className,
}: BlankNumberProps) {
  // What the reader is typing exists only while the field has focus;
  // otherwise the blank shows the committed value in their number format
  const [draft, setDraft] = useState<string | null>(null)
  const [draftInvalid, setDraftInvalid] = useState(false)
  const text = draft ?? format(value)

  function accept(raw: string) {
    setDraft(raw)
    const parsed = parseAmount(raw)
    const ok =
      parsed !== null &&
      parsed >= min &&
      parsed <= max &&
      (!integer || Number.isInteger(parsed))
    setDraftInvalid(!ok)
    if (ok) onCommit(parsed)
  }

  function nudge(direction: 1 | -1, large: boolean) {
    const next = Math.min(
      max,
      Math.max(min, value + direction * step * (large ? 10 : 1))
    )
    const rounded = integer ? Math.round(next) : Math.round(next * 100) / 100
    setDraftInvalid(false)
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
      className={className ? `blank ${className}` : "blank"}
      aria-label={label}
      aria-invalid={draftInvalid || invalid}
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
        setDraftInvalid(false)
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

export function BlankSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: BlankSelectProps<T>) {
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

interface BlankDateProps {
  label: string
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  invalid?: boolean
  describedBy?: string
}

// A blank that holds a date: it reads like the other blanks and opens the
// calendar when pressed
export function BlankDate({
  label,
  value,
  onChange,
  invalid = false,
  describedBy,
}: BlankDateProps) {
  const [open, setOpen] = useState(false)
  const text = value ? formatDate(value) : "a date"
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <span className="relative inline-block">
        <PopoverTrigger
          render={
            <button
              type="button"
              className="blank blank-select peer whitespace-nowrap"
              aria-label={label}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              style={{ width: `calc(${text.length}ch + 1.5em)` }}
            />
          }
        >
          {text}
        </PopoverTrigger>
        <ChevronDown
          aria-hidden="true"
          strokeWidth={2.25}
          className="pointer-events-none absolute top-1/2 right-[0.3em] size-[0.6em] -translate-y-[40%] peer-focus:text-mark-ink"
        />
      </span>
      <PopoverContent className="w-auto p-3">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          startMonth={new Date(2010, 0)}
          endMonth={new Date(2040, 11)}
          selected={value}
          onSelect={(date) => {
            onChange(date)
            setOpen(false)
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
