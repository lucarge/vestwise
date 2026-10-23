import { startOfDay } from "date-fns"
import type { ValuationEntry } from "@/types/valuation"

// The valuation form's values and rules, apart from its fields so a new
// company's form can hold the same ones

export interface ValuationFormData {
  date: Date | undefined
  valuation: string
  shares: string
  pricePerShare: string
  amountRaised: string
}

export type ValuationErrors = Partial<Record<keyof ValuationFormData, string>>

export type Figure = "valuation" | "shares" | "pricePerShare"

// Dated today as the calendar dates it, at midnight
export function emptyValuation(): ValuationFormData {
  return {
    date: startOfDay(new Date()),
    valuation: "",
    shares: "",
    pricePerShare: "",
    amountRaised: "",
  }
}

function text(value: number | undefined): string {
  return value !== undefined ? String(value) : ""
}

export function entryToFormData(entry: ValuationEntry): ValuationFormData {
  return {
    date: entry.date,
    valuation: text(entry.valuation),
    shares: text(entry.shares),
    pricePerShare: text(entry.pricePerShare),
    amountRaised: text(entry.amountRaised),
  }
}

function filled(value: string): boolean {
  return value.trim() !== ""
}

function parsed(value: string): number {
  return parseFloat(value)
}

// Two of the valuation, the share count and the price per share give the
// third, which the form shows worked out and keeps the reader from typing
export function workedOut(form: ValuationFormData): {
  figure: Figure
  value: string
} | null {
  const valuation = filled(form.valuation) ? parsed(form.valuation) : NaN
  const shares = filled(form.shares) ? parsed(form.shares) : NaN
  const price = filled(form.pricePerShare) ? parsed(form.pricePerShare) : NaN
  if (valuation > 0 && shares > 0 && !filled(form.pricePerShare)) {
    return {
      figure: "pricePerShare",
      value: String(Math.round((valuation / shares) * 100) / 100),
    }
  }
  if (valuation > 0 && price > 0 && !filled(form.shares)) {
    return { figure: "shares", value: String(Math.round(valuation / price)) }
  }
  if (shares > 0 && price > 0 && !filled(form.valuation)) {
    return { figure: "valuation", value: String(Math.round(shares * price)) }
  }
  return null
}

// Each message is a sentence, read out under its field
export function validateValuation(
  form: ValuationFormData
): ValuationErrors | null {
  const errs: ValuationErrors = {}
  if (!form.date) errs.date = "Choose the date of the valuation."

  const above = (value: string) => !isNaN(parsed(value)) && parsed(value) > 0
  if (filled(form.valuation) && !above(form.valuation)) {
    errs.valuation = "Enter a valuation above zero, or leave it empty."
  }
  if (filled(form.shares) && !above(form.shares)) {
    errs.shares = "Enter a share count above zero, or leave it empty."
  }
  if (filled(form.pricePerShare) && !above(form.pricePerShare)) {
    errs.pricePerShare = "Enter a price above zero, or leave it empty."
  }
  const priced =
    filled(form.pricePerShare) ||
    (filled(form.valuation) && filled(form.shares))
  if (!priced && !errs.pricePerShare) {
    errs.pricePerShare =
      "Enter the price per share, or the valuation and the share count."
  }

  if (filled(form.amountRaised)) {
    const valuation = filled(form.valuation)
      ? parsed(form.valuation)
      : parsed(workedOut(form)?.value ?? "")
    if (!above(form.amountRaised)) {
      errs.amountRaised = "Enter an amount above zero, or leave it empty."
    } else if (valuation > 0 && parsed(form.amountRaised) >= valuation) {
      errs.amountRaised =
        "The amount raised must be below the post-money valuation."
    }
  }
  return Object.keys(errs).length > 0 ? errs : null
}

/** The entry keeps only what was typed; its third figure is worked out on read */
export function formToEntry(form: ValuationFormData, id: string): ValuationEntry {
  return {
    id,
    date: form.date!,
    ...(filled(form.valuation) ? { valuation: parsed(form.valuation) } : {}),
    ...(filled(form.shares) ? { shares: parsed(form.shares) } : {}),
    ...(filled(form.pricePerShare)
      ? { pricePerShare: parsed(form.pricePerShare) }
      : {}),
    ...(filled(form.amountRaised)
      ? { amountRaised: parsed(form.amountRaised) }
      : {}),
  }
}
