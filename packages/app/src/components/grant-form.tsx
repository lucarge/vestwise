import { useMemo, useState } from "react"
import { startOfDay } from "date-fns"
import { ArrowRight } from "lucide-react"
import {
  BlankNumber,
  BlankSelect,
  Mark,
  RollingNumber,
  amount,
  euro,
  euroPrecise,
  fitFigure,
  formatDate,
  month,
  shares,
} from "@vestwise/brand"

import { BlankCompany, BlankDate } from "@/components/brand/blank"
import { Split } from "@/components/brand/part"
import { Button } from "@/components/ui/button"
import {
  type GrantLink,
  companyOf,
  findCompany,
  grantPrice,
  linkGrant,
  priceOf,
  valuationAt,
} from "@/lib/company"
import { validateGrantForm, type GrantFormErrors } from "@/lib/grant-validation"
import { computeGrantTimeline } from "@/lib/vesting"
import type { Company } from "@/types/company"
import type {
  Grant,
  GrantFormData,
  GrantPrefill,
  GrantValueMode,
  VestingSchedule,
} from "@/types/grant"

// A new clause starts today, as the calendar dates it: at midnight, so it
// compares cleanly with a valuation recorded the same day
function defaultFormData(): GrantFormData {
  return {
    grantDate: startOfDay(new Date()),
    vestingSchedule: "monthly",
    vestingPeriodMonths: "48",
    cliffMonths: "12",
    grantedAmount: "",
    vsopsValue: "",
    vsopsStrikePrice: "",
  }
}

const SCHEDULES: { value: VestingSchedule; label: string }[] = [
  { value: "monthly", label: "monthly" },
  { value: "quarterly", label: "quarterly" },
  { value: "yearly", label: "yearly" },
]

const VALUE_MODES: { value: GrantValueMode; label: string }[] = [
  { value: "per-share", label: "per share" },
  { value: "total", label: "in total" },
]

// The company is checked here, not with the terms: grant links from the
// landing page run through validateGrantForm and carry no company
type ClauseErrors = GrantFormErrors & { company?: string }
type ClauseField = keyof ClauseErrors

// The order the margin reports problems in: the terms a reader fills first
const FIELD_ORDER: ClauseField[] = [
  "company",
  "grantedAmount",
  "vsopsValue",
  "vsopsStrikePrice",
  "vestingPeriodMonths",
  "grantDate",
  "cliffMonths",
  "vestingSchedule",
]

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

function numberOf(text: string): number {
  const n = parseFloat(text)
  return Number.isFinite(n) ? n : 0
}

function firstProblem(errors: ClauseErrors | null): string | null {
  if (!errors) return null
  for (const key of FIELD_ORDER) {
    if (errors[key]) return errors[key]
  }
  return null
}

// What a company brings to a grant made on a date: the price per share in
// effect then, and its strike for new grants, as the form's inputs hold them
function companyTerms(company: Company, date: Date | undefined) {
  const entry = date ? valuationAt(company, date) : undefined
  const price = entry ? priceOf(entry) : undefined
  return {
    price:
      price !== undefined ? String(Math.round(price * 100) / 100) : undefined,
    strike:
      company.strikePrice !== undefined
        ? String(company.strikePrice)
        : undefined,
  }
}

/** Which blanks hold the reader's own figures, which a company leaves alone */
interface OwnTerms {
  value: boolean
  strike: boolean
}

// The grant the terms describe, before it has a company
function termsToGrant(
  id: string,
  form: GrantFormData,
  valueMode: GrantValueMode
): Grant {
  const count = parseFloat(form.grantedAmount)
  const value = parseFloat(form.vsopsValue)
  return {
    id,
    companyId: "",
    grantDate: form.grantDate!,
    vestingSchedule: form.vestingSchedule,
    vestingPeriodMonths: parseInt(form.vestingPeriodMonths),
    cliffMonths: parseInt(form.cliffMonths),
    grantedAmount: count,
    vsopsValue: valueMode === "per-share" ? value * count : value,
    vsopsStrikePrice: parseFloat(form.vsopsStrikePrice),
  }
}

function withCompanyTerms(
  form: GrantFormData,
  company: Company,
  own: OwnTerms
): GrantFormData {
  const terms = companyTerms(company, form.grantDate)
  return {
    ...form,
    ...(!own.value && terms.price ? { vsopsValue: terms.price } : {}),
    ...(!own.strike && terms.strike ? { vsopsStrikePrice: terms.strike } : {}),
  }
}

interface GrantFormProps {
  /** The reader's companies: the clause names one, or a new one */
  companies: Company[]
  /** Saving may add or change the grant's company too */
  onAddGrant?: (grant: Grant, company?: Company) => void
  /** Starting values when adding a grant; ignored when editing */
  prefill?: GrantPrefill
  initialGrant?: Grant
  onUpdateGrant?: (grant: Grant, company?: Company) => void
  /** On a page the margin answers beside the clause; in a dialog, under it */
  variant?: "page" | "dialog"
}

// The grant is a clause: the agreement's own sentence, with its blanks as
// inputs, and VestWise's answer in the margin as the terms change
export function GrantForm({
  companies,
  onAddGrant,
  prefill,
  initialGrant,
  onUpdateGrant,
  variant = "page",
}: GrantFormProps) {
  const isEditing = !!initialGrant
  // With one company on record, a new grant starts from it
  const onlyCompany = companies.length === 1 ? companies[0] : undefined
  // A grant's own terms and a grant link's are the reader's
  const startsOwn: OwnTerms = {
    value: !!(initialGrant || prefill),
    strike: !!(initialGrant || prefill),
  }
  const [own, setOwn] = useState<OwnTerms>(startsOwn)
  const [companyName, setCompanyName] = useState(() =>
    initialGrant
      ? (companyOf(initialGrant, companies)?.name ?? "")
      : (onlyCompany?.name ?? "")
  )
  const [form, setForm] = useState<GrantFormData>(() => {
    if (initialGrant) return grantToFormData(initialGrant)
    if (prefill) return prefill.form
    return onlyCompany
      ? withCompanyTerms(defaultFormData(), onlyCompany, startsOwn)
      : defaultFormData()
  })
  const [valueMode, setValueMode] = useState<GrantValueMode>(
    initialGrant ? "total" : (prefill?.valueMode ?? "per-share")
  )
  // Problems only strike a blank through once the reader has tried to sign
  const [submitted, setSubmitted] = useState(false)
  const [now] = useState(Date.now)

  function updateField<K extends keyof GrantFormData>(
    key: K,
    value: GrantFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // A company the clause names fills the value and the strike, unless the
  // reader typed their own
  function fillFrom(company: Company | undefined, next: GrantFormData) {
    if (!company) return
    const filled = withCompanyTerms(next, company, own)
    setForm(filled)
    if (filled.vsopsValue !== next.vsopsValue) setValueMode("per-share")
  }

  function changeCompany(name: string) {
    setCompanyName(name)
    fillFrom(findCompany(companies, name), form)
  }

  function changeGrantDate(date: Date | undefined) {
    const next = { ...form, grantDate: date }
    setForm(next)
    fillFrom(findCompany(companies, companyName), next)
  }

  function switchValueMode(mode: GrantValueMode) {
    if (mode === valueMode) return
    const value = parseFloat(form.vsopsValue)
    const count = parseFloat(form.grantedAmount)
    if (!isNaN(value) && value > 0 && !isNaN(count) && count > 0) {
      const converted = mode === "per-share" ? value / count : value * count
      updateField("vsopsValue", String(Math.round(converted * 100) / 100))
    }
    setValueMode(mode)
  }

  const errors = useMemo((): ClauseErrors | null => {
    const termsErrors = validateGrantForm(form)
    const companyError = companyName.trim()
      ? undefined
      : "Name the company that grants the shares."
    if (!termsErrors && !companyError) return null
    return { ...termsErrors, ...(companyError ? { company: companyError } : {}) }
  }, [form, companyName])
  const problem = firstProblem(errors)
  const flag = (key: ClauseField) => submitted && !!errors?.[key]

  // What the terms are worth, computed the moment they make sense
  const preview = useMemo(() => {
    if (errors) return null
    const grant = termsToGrant(initialGrant?.id ?? "preview", form, valueMode)
    const timeline = computeGrantTimeline(grant)
    let vested = 0
    for (const ev of timeline.events) {
      if (ev.date.getTime() <= now) vested = ev.cumulativeVested
    }
    const perShare = grantPrice(grant)
    const last = timeline.events[timeline.events.length - 1]
    return {
      grant,
      link: linkGrant(grant, companyName, companies, () => "preview"),
      shares: grant.grantedAmount,
      vestedShares: vested,
      vestedNet: vested * (perShare - grant.vsopsStrikePrice),
      totalNet: grant.vsopsValue - grant.vsopsStrikePrice * grant.grantedAmount,
      fullyVested: last?.date ?? grant.grantDate,
      underwater: perShare < grant.vsopsStrikePrice,
    }
  }, [form, valueMode, errors, now, companyName, companies, initialGrant])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (errors) return

    const grant = termsToGrant(
      isEditing ? initialGrant.id : crypto.randomUUID(),
      form,
      valueMode
    )
    const link = linkGrant(grant, companyName, companies)

    if (isEditing) {
      onUpdateGrant?.(link.grant, link.company)
    } else {
      onAddGrant?.(link.grant, link.company)
      const fresh = { value: false, strike: false }
      setOwn(fresh)
      setCompanyName(onlyCompany?.name ?? "")
      setForm(
        onlyCompany
          ? withCompanyTerms(defaultFormData(), onlyCompany, fresh)
          : defaultFormData()
      )
      setValueMode("per-share")
      setSubmitted(false)
    }
  }

  const inDialog = variant === "dialog"
  const vested = preview ? euro(preview.vestedNet) : ""

  const clause = (
    <form onSubmit={handleSubmit} noValidate>
      <p
        className={
          inDialog
            ? "voice-clause text-[1.125rem] leading-[1.9]"
            : "voice-clause text-[1.1875rem] leading-[1.9] lg:text-[1.375rem] lg:leading-[1.85]"
        }
      >
        <span className="font-semibold">§ 1 Grant.</span>{" "}
        <BlankCompany
          label="The company that grants the shares"
          value={companyName}
          names={companies.map((c) => c.name)}
          onChange={changeCompany}
          invalid={flag("company")}
          describedBy="grant-status"
        />{" "}
        grants the Participant{" "}
        <BlankNumber
          label="Number of virtual shares"
          value={numberOf(form.grantedAmount)}
          onCommit={(v) => updateField("grantedAmount", String(v))}
          format={shares}
          min={0}
          max={100_000_000}
          step={100}
          minChars={3}
          invalid={flag("grantedAmount")}
          describedBy="grant-status"
        />{" "}
        Virtual Shares, valued at EUR{" "}
        <BlankNumber
          label={
            valueMode === "per-share"
              ? "Value per share in euros"
              : "Value of all shares in euros"
          }
          value={numberOf(form.vsopsValue)}
          onCommit={(v) => {
            updateField("vsopsValue", String(v))
            setOwn((prev) => ({ ...prev, value: true }))
          }}
          format={amount}
          min={0}
          max={1_000_000_000_000}
          step={valueMode === "per-share" ? 0.25 : 1000}
          minChars={4}
          invalid={flag("vsopsValue")}
          describedBy="grant-status"
        />{" "}
        <BlankSelect
          label="Whether the value is per share or in total"
          value={valueMode}
          options={VALUE_MODES}
          onChange={switchValueMode}
        />
        , at a Strike Price of EUR{" "}
        <BlankNumber
          label="Strike price per share in euros"
          value={numberOf(form.vsopsStrikePrice)}
          onCommit={(v) => {
            updateField("vsopsStrikePrice", String(v))
            setOwn((prev) => ({ ...prev, strike: true }))
          }}
          format={amount}
          min={0}
          max={10_000_000}
          step={0.25}
          minChars={4}
          invalid={flag("vsopsStrikePrice")}
          describedBy="grant-status"
        />{" "}
        per share. The Virtual Shares vest{" "}
        <BlankSelect
          label="Vesting schedule"
          value={form.vestingSchedule}
          options={SCHEDULES}
          onChange={(schedule) => updateField("vestingSchedule", schedule)}
        />{" "}
        over{" "}
        <BlankNumber
          label="Vesting period in months"
          value={numberOf(form.vestingPeriodMonths)}
          onCommit={(v) => updateField("vestingPeriodMonths", String(v))}
          format={shares}
          integer
          min={0}
          max={240}
          invalid={flag("vestingPeriodMonths")}
          describedBy="grant-status"
        />{" "}
        months, starting{" "}
        <BlankDate
          label="Grant date"
          value={form.grantDate}
          onChange={changeGrantDate}
          invalid={flag("grantDate")}
          describedBy="grant-status"
        />
        , after a Cliff of{" "}
        <BlankNumber
          label="Cliff in months"
          value={numberOf(form.cliffMonths)}
          onCommit={(v) => updateField("cliffMonths", String(v))}
          format={shares}
          integer
          min={0}
          max={239}
          invalid={flag("cliffMonths")}
          describedBy="grant-status"
        />{" "}
        months.
      </p>

      {inDialog ? (
        <>
          <p
            id="grant-status"
            role="status"
            className="figures mt-5 text-[0.9375rem] leading-snug text-ink-soft"
          >
            {preview ? (
              <>
                Worth{" "}
                <span className="font-semibold text-ink">
                  <RollingNumber value={vested} />
                </span>{" "}
                net today, {euro(preview.totalNet)} once fully vested.
                {preview.link.change && (
                  <>
                    {" "}
                    <CompanyChange link={preview.link} grant={preview.grant} />
                  </>
                )}
              </>
            ) : (
              <span className="font-semibold text-ink">{problem}</span>
            )}
          </p>
          <div className="mt-5 flex justify-end border-t border-ink pt-4">
            <Button type="submit">
              Save changes
              <ArrowRight data-icon="inline-end" strokeWidth={2.25} />
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* The Participant's signature line carries the action */}
          <div className="mt-line flex h-[4.25rem] items-end border-b border-ink pb-2">
            <Button type="submit" size="lg">
              {isEditing ? "Save changes" : "Add grant"}
              <ArrowRight data-icon="inline-end" strokeWidth={2.25} />
            </Button>
          </div>
          <p className="mt-2 text-[0.875rem] text-ink-soft">The Participant</p>
        </>
      )}
    </form>
  )

  if (inDialog) return clause

  const margin = (
    <aside aria-label="What these terms are worth">
      <p className="text-[0.9375rem] font-medium">Net value vested today</p>
      {!preview ? (
        <p
          id="grant-status"
          role="status"
          className="mt-3 max-w-[30ch] text-[1.0625rem] leading-snug font-semibold"
        >
          {problem}
        </p>
      ) : (
        <>
          <p
            className="voice-figure fit-figure mt-3 [--fig:clamp(2.5rem,4vw,3.5rem)]"
            style={fitFigure(vested, 8)}
          >
            <Mark>
              <RollingNumber value={vested} />
            </Mark>
          </p>
          <p id="grant-status" role="status" className="sr-only">
            Net value vested today: {vested}
          </p>
          <p className="mt-4 max-w-[34ch] text-[0.9375rem] leading-snug text-ink-soft">
            <span className="figures font-semibold text-ink">
              <RollingNumber value={shares(Math.round(preview.vestedShares))} />
            </span>{" "}
            of {shares(preview.shares)} shares. Fully vested{" "}
            {month(preview.fullyVested)}.
          </p>
          <div className="mt-line border-t border-ink pt-4">
            <p className="voice-figure text-[1.75rem]">
              <RollingNumber value={euro(preview.totalNet)} />
            </p>
            <p className="mt-1.5 text-[0.9375rem] leading-snug text-ink-soft">
              net once fully vested
            </p>
          </div>
          {preview.link.change && (
            <p className="mt-line max-w-[34ch] border-t border-ink pt-4 text-[0.9375rem] leading-snug text-ink-soft">
              <CompanyChange link={preview.link} grant={preview.grant} />
            </p>
          )}
          <p className="mt-line text-[0.8125rem] leading-snug text-ink-muted">
            {preview.underwater
              ? "The strike price is above the value per share, so the grant is underwater for now."
              : "Net value is the value of the shares minus the strike price, before tax."}
          </p>
        </>
      )}
    </aside>
  )

  return <Split terms={clause} answer={margin} />
}

// What adding or saving the grant also does to its company, said before it
// happens
function CompanyChange({ link, grant }: { link: GrantLink; grant: Grant }) {
  const name = link.company?.name
  if (!link.change || !name) return null
  const price = (
    <span className="figures font-semibold text-ink">
      {euroPrecise(grantPrice(grant))}
    </span>
  )
  const date = formatDate(grant.grantDate)
  switch (link.change) {
    case "creates":
      return (
        <>
          Also adds {name} to your companies, at {price} a share.
        </>
      )
    case "records":
      return (
        <>
          Also records {price} a share as {name}’s valuation on {date}.
        </>
      )
    case "updates":
      return (
        <>
          Also moves the valuation this grant recorded for {name} to {price} a
          share on {date}.
        </>
      )
  }
}
