// A blank that holds a date, the app's own: the other blanks come from
// @vestwise/brand, this one needs the shadcn Calendar and Popover
import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { formatDate } from "@vestwise/brand"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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
