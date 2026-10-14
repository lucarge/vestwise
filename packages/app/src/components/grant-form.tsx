import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { validateGrantForm, type GrantFormErrors } from "@/lib/grant-validation"
import { cn } from "@/lib/utils"
import type {
  Grant,
  GrantFormData,
  GrantPrefill,
  GrantValueMode,
  VestingSchedule,
} from "@/types/grant"

const defaultFormData: GrantFormData = {
  grantDate: new Date(),
  vestingSchedule: "monthly",
  vestingPeriodMonths: "48",
  cliffMonths: "12",
  grantedAmount: "",
  vsopsValue: "",
  vsopsStrikePrice: "",
}

function grantToFormData(grant: Grant): GrantFormData {
  return {
    grantDate: grant.grantDate,
    vestingSchedule: grant.vestingSchedule,
    vestingPeriodMonths: String(grant.vestingPeriodMonths),
    cliffMonths: String(grant.cliffMonths),
    grantedAmount: String(grant.grantedAmount),
    vsopsValue: String(grant.vsopsValue),
    vsopsStrikePrice: String(grant.vsopsStrikePrice),
  }
}

interface GrantFormProps {
  onAddGrant?: (grant: Grant) => void
  /** Starting values when adding a grant; ignored when editing */
  prefill?: GrantPrefill
  initialGrant?: Grant
  onUpdateGrant?: (grant: Grant) => void
  className?: string
}

export function GrantForm({ onAddGrant, prefill, initialGrant, onUpdateGrant, className }: GrantFormProps) {
  const isEditing = !!initialGrant
  const [form, setForm] = useState<GrantFormData>(
    initialGrant ? grantToFormData(initialGrant) : (prefill?.form ?? defaultFormData),
  )
  const [errors, setErrors] = useState<GrantFormErrors>({})
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [valueMode, setValueMode] = useState<GrantValueMode>(
    initialGrant ? "total" : (prefill?.valueMode ?? "total"),
  )

  function updateField<K extends keyof GrantFormData>(key: K, value: GrantFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  function switchValueMode(mode: GrantValueMode) {
    if (mode === valueMode) return
    const value = parseFloat(form.vsopsValue)
    const shares = parseFloat(form.grantedAmount)
    if (!isNaN(value) && value > 0 && !isNaN(shares) && shares > 0) {
      const converted = mode === "per-share" ? value / shares : value * shares
      updateField("vsopsValue", String(Math.round(converted * 100) / 100))
    }
    setValueMode(mode)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const validationErrors = validateGrantForm(form)
    if (validationErrors) {
      setErrors(validationErrors)
      return
    }

    const totalValue =
      valueMode === "per-share"
        ? parseFloat(form.vsopsValue) * parseFloat(form.grantedAmount)
        : parseFloat(form.vsopsValue)

    const grant: Grant = {
      id: isEditing ? initialGrant.id : crypto.randomUUID(),
      grantDate: form.grantDate!,
      vestingSchedule: form.vestingSchedule,
      vestingPeriodMonths: parseInt(form.vestingPeriodMonths),
      cliffMonths: parseInt(form.cliffMonths),
      grantedAmount: parseFloat(form.grantedAmount),
      vsopsValue: totalValue,
      vsopsStrikePrice: parseFloat(form.vsopsStrikePrice),
    }

    if (isEditing) {
      onUpdateGrant?.(grant)
    } else {
      onAddGrant?.(grant)
      setForm(defaultFormData)
      setErrors({})
      setValueMode("total")
    }
  }

  const formContent = (
    <TooltipProvider>
      <form onSubmit={handleSubmit} className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4", className)}>
            <Field label="Grant date" tooltip="The date the stock option grant was issued" error={errors.grantDate}>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.grantDate && "text-muted-foreground",
                      )}
                      aria-invalid={!!errors.grantDate}
                    />
                  }
                >
                  <CalendarIcon className="mr-1.5 size-4" />
                  {form.grantDate ? format(form.grantDate, "MMM d, yyyy") : "Pick a date"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    startMonth={new Date(2010, 0)}
                    endMonth={new Date(2040, 11)}
                    selected={form.grantDate}
                    onSelect={(date) => {
                      updateField("grantDate", date)
                      setDatePickerOpen(false)
                    }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </Field>

            <Field label="Vesting schedule" tooltip="How often shares vest (monthly, quarterly, or yearly)" error={errors.vestingSchedule}>
              <Select
                value={form.vestingSchedule}
                onValueChange={(value) => {
                  if (value) updateField("vestingSchedule", value as VestingSchedule)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Vesting period (months)" tooltip="Total duration over which shares vest" error={errors.vestingPeriodMonths}>
              <Input
                type="number"
                min={1}
                value={form.vestingPeriodMonths}
                onChange={(e) => updateField("vestingPeriodMonths", e.target.value)}
                aria-invalid={!!errors.vestingPeriodMonths}
              />
            </Field>

            <Field label="Cliff (months)" tooltip="Initial period before any shares vest" error={errors.cliffMonths}>
              <Input
                type="number"
                min={0}
                value={form.cliffMonths}
                onChange={(e) => updateField("cliffMonths", e.target.value)}
                aria-invalid={!!errors.cliffMonths}
              />
            </Field>

            <Field label="Number of shares" tooltip="Total number of shares in this grant" error={errors.grantedAmount}>
              <Input
                type="number"
                min={0}
                step="any"
                placeholder="e.g. 10000"
                value={form.grantedAmount}
                onChange={(e) => updateField("grantedAmount", e.target.value)}
                aria-invalid={!!errors.grantedAmount}
              />
            </Field>

            <Field
              label="Value (EUR)"
              tooltip="Total monetary value of the granted shares"
              error={errors.vsopsValue}
              trailing={
                <div className="flex rounded-md border border-border text-[0.65rem] leading-none dark:border-input">
                  <button
                    type="button"
                    className={cn(
                      "rounded-l-[5px] px-1.5 py-1 transition-colors",
                      valueMode === "total"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => switchValueMode("total")}
                  >
                    Total
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "rounded-r-[5px] px-1.5 py-1 transition-colors",
                      valueMode === "per-share"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => switchValueMode("per-share")}
                  >
                    Per share
                  </button>
                </div>
              }
            >
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder={valueMode === "total" ? "e.g. 50000" : "e.g. 5.00"}
                value={form.vsopsValue}
                onChange={(e) => updateField("vsopsValue", e.target.value)}
                aria-invalid={!!errors.vsopsValue}
              />
            </Field>

            <Field label="Strike price (EUR)" tooltip="Price per share you pay to exercise the option" error={errors.vsopsStrikePrice}>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="e.g. 5.00"
                value={form.vsopsStrikePrice}
                onChange={(e) => updateField("vsopsStrikePrice", e.target.value)}
                aria-invalid={!!errors.vsopsStrikePrice}
              />
            </Field>

            <div className="flex items-end">
              <Button type="submit" className="w-full">
                {isEditing ? "Save Changes" : "Add Grant"}
              </Button>
            </div>
          </form>
        </TooltipProvider>
  )

  return formContent
}

function Field({
  label,
  tooltip,
  error,
  trailing,
  children,
}: {
  label: string
  tooltip?: string
  error?: string
  trailing?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex h-5 items-center gap-1.5">
        {tooltip ? (
          <Tooltip>
            <TooltipTrigger render={<Label />} className="underline decoration-dotted decoration-muted-foreground/50 underline-offset-4">
              {label}
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        ) : (
          <Label>{label}</Label>
        )}
        {trailing}
      </div>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
