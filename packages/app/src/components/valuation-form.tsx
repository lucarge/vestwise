import { useId, useState } from "react"
import { ArrowRight, ChevronDown } from "lucide-react"
import { formatDate } from "@vestwise/brand"

import { Field } from "@/components/brand/field"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  type Figure,
  type ValuationErrors,
  type ValuationFormData,
  emptyValuation,
  entryToFormData,
  formToEntry,
  validateValuation,
  workedOut,
} from "@/lib/valuation-form"
import type { ValuationEntry } from "@/types/valuation"

interface ValuationFieldsProps {
  form: ValuationFormData
  onChange: (form: ValuationFormData) => void
  errors: ValuationErrors | null
}

// The fields of a valuation, shared by a new company and a new valuation
export function ValuationFields({ form, onChange, errors }: ValuationFieldsProps) {
  const id = useId()
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const derived = workedOut(form)

  function update<K extends keyof ValuationFormData>(
    key: K,
    value: ValuationFormData[K]
  ) {
    onChange({ ...form, [key]: value })
  }

  function figure(key: Figure, label: string, tooltip: string, placeholder: string) {
    const isDerived = derived?.figure === key
    return (
      <Field
        label={label}
        htmlFor={`${id}-${key}`}
        tooltip={tooltip}
        hint={isDerived ? "Worked out from the other two." : undefined}
        error={errors?.[key]}
      >
        <Input
          id={`${id}-${key}`}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          placeholder={placeholder}
          value={isDerived ? derived.value : form[key]}
          disabled={isDerived}
          onChange={(e) => update(key, e.target.value)}
          aria-invalid={!!errors?.[key]}
        />
      </Field>
    )
  }

  return (
    <>
      <Field
        label="Date"
        tooltip="The date this valuation applies from"
        error={errors?.date}
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
                aria-label="Date of the valuation"
                aria-invalid={!!errors?.date}
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
                update("date", date)
                setDatePickerOpen(false)
              }}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </Field>

      <Field
        label="Amount raised"
        htmlFor={`${id}-raised`}
        tooltip="The capital raised in this round, in euros. Optional: dilution is worked out from it"
        error={errors?.amountRaised}
      >
        <Input
          id={`${id}-raised`}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          placeholder="10,000,000"
          value={form.amountRaised}
          onChange={(e) => update("amountRaised", e.target.value)}
          aria-invalid={!!errors?.amountRaised}
        />
      </Field>

      {figure(
        "valuation",
        "Post-money valuation",
        "The company's valuation right after the round, in euros",
        "40,000,000"
      )}
      {figure(
        "shares",
        "Shares",
        "Fully diluted shares after the round: the count the price per share is based on",
        "13,333"
      )}
      {figure(
        "pricePerShare",
        "Price per share",
        "In euros. Give it, or the valuation and the shares to work it out",
        "3,000"
      )}
    </>
  )
}

interface ValuationFormProps {
  initialEntry?: ValuationEntry
  onSave: (entry: ValuationEntry) => void
}

// A valuation is VestWise's own record, so its fields are labeled blanks
// rather than a clause
export function ValuationForm({ initialEntry, onSave }: ValuationFormProps) {
  const isEditing = !!initialEntry
  const [form, setForm] = useState<ValuationFormData>(() =>
    initialEntry ? entryToFormData(initialEntry) : emptyValuation()
  )
  const [submitted, setSubmitted] = useState(false)
  const errors = validateValuation(form)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (errors) return
    // Saving the reader's own figures makes the entry theirs, even one a
    // grant recorded
    onSave(formToEntry(form, initialEntry?.id ?? crypto.randomUUID()))
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-x-8 gap-y-5 sm:grid-cols-2"
    >
      <ValuationFields
        form={form}
        onChange={setForm}
        errors={submitted ? errors : null}
      />
      <div className="flex justify-end border-t border-ink pt-4 sm:col-span-2">
        <Button type="submit">
          {isEditing ? "Save changes" : "Record valuation"}
          <ArrowRight data-icon="inline-end" strokeWidth={2.25} />
        </Button>
      </div>
    </form>
  )
}
