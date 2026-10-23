// The app's own blanks: the others come from @vestwise/brand, these need the
// shadcn Calendar and Popover, and Base UI's Autocomplete
import { useState } from "react"
import { Autocomplete } from "@base-ui/react/autocomplete"
import { ChevronDown } from "lucide-react"
import { formatDate } from "@vestwise/brand"
import { Calendar } from "@/components/ui/calendar"
import { useDialogPortalContainer } from "@/components/ui/dialog-portal-context"
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

interface BlankCompanyProps {
  label: string
  value: string
  /** The reader's companies, offered as they type */
  names: string[]
  onChange: (name: string) => void
  invalid?: boolean
  describedBy?: string
}

const COMPANY_PLACEHOLDER = "The Company"

// A blank that names a company: the reader types a name, or picks one of
// theirs from a list that opens under it like the date's calendar
export function BlankCompany({
  label,
  value,
  names,
  onChange,
  invalid = false,
  describedBy,
}: BlankCompanyProps) {
  const dialogContainer = useDialogPortalContainer()
  // Names are set in proportional letters, so they get more room than digits
  const chars = Math.max(value.length, COMPANY_PLACEHOLDER.length)
  return (
    <Autocomplete.Root
      items={names}
      value={value}
      onValueChange={(next) => onChange(next)}
      openOnInputClick
    >
      <Autocomplete.Input
        className="blank text-left placeholder:font-medium placeholder:text-ink-muted focus:placeholder:text-mark-ink"
        aria-label={label}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        placeholder={COMPANY_PLACEHOLDER}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="done"
        style={{ width: `calc(${Math.ceil(chars * 1.1)}ch + 0.5em)` }}
      />
      {names.length > 0 && (
        <Autocomplete.Portal container={dialogContainer ?? undefined}>
          <Autocomplete.Positioner
            sideOffset={6}
            align="start"
            className="isolate z-50"
          >
            <Autocomplete.Popup className="max-h-(--available-height) min-w-(--anchor-width) overflow-y-auto border border-ink bg-popover py-1 text-popover-foreground transition-opacity duration-150 ease-out data-empty:hidden data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
              <Autocomplete.List>
                {(name: string) => (
                  <Autocomplete.Item
                    key={name}
                    value={name}
                    className="cursor-default px-3 py-1.5 text-[0.9375rem] whitespace-nowrap outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                  >
                    {name}
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      )}
    </Autocomplete.Root>
  )
}
