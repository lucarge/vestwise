import type { GrantFormData } from "@/types/grant"

export type GrantFormErrors = Partial<Record<keyof GrantFormData, string>>

// The grant form's rules. Grant links from the landing page are checked
// against the same rules before they prefill the form.
export function validateGrantForm(form: GrantFormData): GrantFormErrors | null {
  const errs: GrantFormErrors = {}

  if (!form.grantDate) errs.grantDate = "Required"

  const vestingPeriod = parseInt(form.vestingPeriodMonths)
  if (!form.vestingPeriodMonths || isNaN(vestingPeriod) || vestingPeriod < 1) {
    errs.vestingPeriodMonths = "Must be at least 1"
  }

  const cliff = parseInt(form.cliffMonths)
  if (form.cliffMonths === "" || isNaN(cliff) || cliff < 0) {
    errs.cliffMonths = "Must be 0 or more"
  } else if (!isNaN(vestingPeriod) && cliff >= vestingPeriod) {
    errs.cliffMonths = "Must be less than vesting period"
  }

  const amount = parseFloat(form.grantedAmount)
  if (!form.grantedAmount || isNaN(amount) || amount <= 0) {
    errs.grantedAmount = "Must be greater than 0"
  }

  const value = parseFloat(form.vsopsValue)
  if (!form.vsopsValue || isNaN(value) || value <= 0) {
    errs.vsopsValue = "Must be greater than 0"
  }

  const strike = parseFloat(form.vsopsStrikePrice)
  if (!form.vsopsStrikePrice || isNaN(strike) || strike <= 0) {
    errs.vsopsStrikePrice = "Must be greater than 0"
  }

  return Object.keys(errs).length > 0 ? errs : null
}
