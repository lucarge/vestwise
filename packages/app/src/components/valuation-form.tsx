import { useState } from "react"
import { ArrowRight, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ValuationEntry } from "@/types/valuation"

interface ValuationFormData {
  date: Date | undefined
  valuation: string
  amountRaised: string
}

const defaultFormData: ValuationFormData = {
  date: new Date(),
  valuation: "",
  amountRaised: "",
}

function entryToFormData(entry: ValuationEntry): ValuationFormData {
  return {
    date: entry.date,
    valuation: String(entry.valuation),
    amountRaised: entry.amountRaised ? String(entry.amountRaised) : "",
  }
}

interface ValuationFormProps {
  onAdd?: (entry: ValuationEntry) => void
  initialEntry?: ValuationEntry
  onUpdate?: (entry: ValuationEntry) => void
  className?: string
}

// A valuation is VestWise's own record, so its fields are labeled blanks
// rather than a clause
export function ValuationForm({
  onAdd,
  initialEntry,
  onUpdate,
  className,
}: ValuationFormProps) {
  const isEditing = !!initialEntry
  const [form, setForm] = useState<ValuationFormData>(
    initialEntry ? entryToFormData(initialEntry) : defaultFormData
  )
  const [errors, setErrors] = useState<
    Partial<Record<keyof ValuationFormData, string>>
  >({})
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  function updateField<K extends keyof ValuationFormData>(
    key: K,
    value: ValuationFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  function validate(): Partial<Record<keyof ValuationFormData, string>> | null {
    const errs: Partial<Record<keyof ValuationFormData, string>> = {}
    if (!form.date) errs.date = "Choose the date of the valuation."
    const val = parseFloat(form.valuation)
    if (!form.valuation || isNaN(val) || val <= 0) {
      errs.valuation = "Enter a valuation above zero."
    }
    if (form.amountRaised) {
      const raised = parseFloat(form.amountRaised)
      if (isNaN(raised) || raised <= 0) {
        errs.amountRaised = "Enter an amount above zero, or leave it empty."
      }
    }
    return Object.keys(errs).length > 0 ? errs : null
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validate()
    if (validationErrors) {
      setErrors(validationErrors)
      return
    }

    const amountRaised = form.amountRaised
      ? parseFloat(form.amountRaised)
      : undefined

    const entry: ValuationEntry = {
      id: isEditing ? initialEntry.id : crypto.randomUUID(),
      date: form.date!,
      valuation: parseFloat(form.valuation),
      amountRaised,
    }

    if (isEditing) {
      onUpdate?.(entry)
    } else {
      onAdd?.(entry)
      setForm(defaultFormData)
      setErrors({})
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn(
        "grid gap-x-8 gap-y-5",
        isEditing
          ? "grid-cols-1"
          : "sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end",
        className
      )}
    >
      <Field
        label="Date"
        tooltip="The date this valuation applies from"
        error={errors.date}
      >
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                className={cn(
                  "field-blank flex cursor-pointer items-center justify-between gap-2 text-left",
                  !form.date && "text-ink-muted"
                )}
                aria-invalid={!!errors.date}
              />
            }
          >
            {form.date ? formatDate(form.date) : "Choose a date"}
            <ChevronDown strokeWidth={2.25} className="size-4 shrink-0" />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3">
            <Calendar
              mode="single"
              captionLayout="dropdown"
              startMonth={new Date(2010, 0)}
              endMonth={new Date(2040, 11)}
              selected={form.date}
              onSelect={(date) => {
                updateField("date", date)
                setDatePickerOpen(false)
              }}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </Field>

      <Field
        label="Company valuation"
        tooltip="The pre-money valuation at this date, in euros"
        error={errors.valuation}
      >
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          placeholder="10,000,000"
          value={form.valuation}
          onChange={(e) => updateField("valuation", e.target.value)}
          aria-invalid={!!errors.valuation}
        />
      </Field>

      <Field
        label="Amount raised"
        tooltip="The capital raised in this round, in euros. Optional: it is what dilution is calculated from"
        error={errors.amountRaised}
      >
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          placeholder="2,000,000"
          value={form.amountRaised}
          onChange={(e) => updateField("amountRaised", e.target.value)}
          aria-invalid={!!errors.amountRaised}
        />
      </Field>

      <div
        className={cn(
          "flex",
          isEditing ? "justify-end border-t border-ink pt-4" : "items-end"
        )}
      >
        <Button type="submit">
          {isEditing ? "Save changes" : "Add valuation"}
          <ArrowRight data-icon="inline-end" strokeWidth={2.25} />
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  tooltip,
  error,
  children,
}: {
  label: string
  tooltip?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-5 items-center">
        {tooltip ? (
          <Tooltip>
            <TooltipTrigger
              render={<Label />}
              className="cursor-help underline decoration-ink-muted decoration-dotted underline-offset-4"
            >
              {label}
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        ) : (
          <Label>{label}</Label>
        )}
      </div>
      {children}
      {error && (
        <p
          role="alert"
          className="text-[0.8125rem] leading-snug text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  )
}
