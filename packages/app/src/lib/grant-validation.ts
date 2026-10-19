import type { GrantFormData } from "@/types/grant"

export type GrantFormErrors = Partial<Record<keyof GrantFormData, string>>

// The grant form's rules. Grant links from the landing page are checked
// against the same rules before they prefill the clause. Each message is a
// sentence, because the margin reads it out as the problem with the terms.
export function validateGrantForm(form: GrantFormData): GrantFormErrors | null {
  const errs: GrantFormErrors = {}

  if (!form.grantDate) errs.grantDate = "Choose the grant date."

  const vestingPeriod = parseInt(form.vestingPeriodMonths)
  if (!form.vestingPeriodMonths || isNaN(vestingPeriod) || vestingPeriod < 1) {
    errs.vestingPeriodMonths = "The vesting period must be at least 1 month."
  }

  const cliff = parseInt(form.cliffMonths)
  if (form.cliffMonths === "" || isNaN(cliff) || cliff < 0) {
    errs.cliffMonths = "The cliff must be 0 months or more."
  } else if (!isNaN(vestingPeriod) && cliff >= vestingPeriod) {
    errs.cliffMonths = "The cliff must be shorter than the vesting period."
  }

  const amount = parseFloat(form.grantedAmount)
  if (!form.grantedAmount || isNaN(amount) || amount <= 0) {
    errs.grantedAmount = "Enter a number of shares above zero."
  }

  const value = parseFloat(form.vsopsValue)
  if (!form.vsopsValue || isNaN(value) || value <= 0) {
    errs.vsopsValue = "Enter a value for the shares above zero."
  }

  const strike = parseFloat(form.vsopsStrikePrice)
  if (!form.vsopsStrikePrice || isNaN(strike) || strike <= 0) {
    errs.vsopsStrikePrice = "Enter a strike price above zero."
  }

  return Object.keys(errs).length > 0 ? errs : null
}
