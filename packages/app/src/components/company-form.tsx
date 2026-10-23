import { useId, useState } from "react"
import { ArrowRight } from "lucide-react"

import { Field } from "@/components/brand/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ValuationFields } from "@/components/valuation-form"
import {
  type ValuationFormData,
  emptyValuation,
  formToEntry,
  validateValuation,
} from "@/lib/valuation-form"
import { findCompany } from "@/lib/company"
import type { Company } from "@/types/company"

interface CompanyFormProps {
  /** The company to change; without one, the form adds a company */
  initialCompany?: Company
  /** Every company on record, so two never share a name */
  companies: Company[]
  onSave: (company: Company) => void
}

// A company is its name, the strike price its new grants start from and,
// when it is new, its first valuation
export function CompanyForm({
  initialCompany,
  companies,
  onSave,
}: CompanyFormProps) {
  const id = useId()
  const isEditing = !!initialCompany
  const [name, setName] = useState(initialCompany?.name ?? "")
  const [strike, setStrike] = useState(
    initialCompany?.strikePrice !== undefined
      ? String(initialCompany.strikePrice)
      : ""
  )
  const [valuation, setValuation] = useState<ValuationFormData>(emptyValuation)
  const [submitted, setSubmitted] = useState(false)

  const namesake = findCompany(companies, name)
  const nameError = !name.trim()
    ? "Name the company."
    : namesake && namesake.id !== initialCompany?.id
      ? "You already have a company with this name."
      : undefined
  const strikeValue = parseFloat(strike)
  const strikeError =
    !strike.trim() || isNaN(strikeValue) || strikeValue <= 0
      ? "Enter a strike price above zero."
      : undefined
  const valuationErrors = isEditing ? null : validateValuation(valuation)
  const invalid = !!(nameError || strikeError || valuationErrors)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (invalid) return
    onSave(
      initialCompany
        ? { ...initialCompany, name: name.trim(), strikePrice: strikeValue }
        : {
            id: crypto.randomUUID(),
            name: name.trim(),
            strikePrice: strikeValue,
            valuations: [formToEntry(valuation, crypto.randomUUID())],
          }
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-x-8 gap-y-5 sm:grid-cols-2"
    >
      <Field
        label="Name"
        htmlFor={`${id}-name`}
        error={submitted ? nameError : undefined}
      >
        <Input
          id={`${id}-name`}
          placeholder="Acme GmbH"
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={submitted && !!nameError}
        />
      </Field>
      <Field
        label="Strike price for new grants"
        htmlFor={`${id}-strike`}
        tooltip="The strike price per share, in euros, that a new grant from this company starts from. Each grant can still set its own"
        error={submitted ? strikeError : undefined}
      >
        <Input
          id={`${id}-strike`}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          placeholder="1.00"
          value={strike}
          onChange={(e) => setStrike(e.target.value)}
          aria-invalid={submitted && !!strikeError}
        />
      </Field>

      {!isEditing && (
        <>
          <p className="border-t border-ink pt-4 text-[0.9375rem] font-semibold sm:col-span-2">
            Its latest valuation
          </p>
          <ValuationFields
            form={valuation}
            onChange={setValuation}
            errors={submitted ? valuationErrors : null}
          />
        </>
      )}

      <div className="flex justify-end border-t border-ink pt-4 sm:col-span-2">
        <Button type="submit">
          {isEditing ? "Save changes" : "Add company"}
          <ArrowRight data-icon="inline-end" strokeWidth={2.25} />
        </Button>
      </div>
    </form>
  )
}
