export type VestingSchedule = "monthly" | "quarterly" | "yearly"

export interface Grant {
  id: string
  /** The company that granted the shares */
  companyId: string
  grantDate: Date
  vestingSchedule: VestingSchedule
  vestingPeriodMonths: number
  cliffMonths: number
  grantedAmount: number
  vsopsValue: number
  vsopsStrikePrice: number
}

export interface GrantFormData {
  grantDate: Date | undefined
  vestingSchedule: VestingSchedule
  vestingPeriodMonths: string
  cliffMonths: string
  grantedAmount: string
  vsopsValue: string
  vsopsStrikePrice: string
}

/** Whether the form's value field holds the total value or the value per share */
export type GrantValueMode = "total" | "per-share"

/** Starting values for a new grant, e.g. terms brought over from the landing page */
export interface GrantPrefill {
  form: GrantFormData
  valueMode: GrantValueMode
}
