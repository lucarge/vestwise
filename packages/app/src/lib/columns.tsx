import type { ReactNode } from "react"
import {
  euroPrecise,
  formatDate,
  percentPrecise,
  shares,
} from "@vestwise/brand"

import type { GrantTotals } from "@/hooks/use-grants"
import type { GrantWithCompany } from "@/lib/company"

const SCHEDULE_LABELS: Record<GrantWithCompany["vestingSchedule"], string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
}

export type ColumnId =
  | "grantDate"
  | "schedule"
  | "vestingPeriod"
  | "cliff"
  | "shares"
  | "value"
  | "strikePrice"
  | "netValue"
  | "appreciation"
  | "ownership"

export interface ColumnTotals extends GrantTotals {
  totalOwnership?: number
}

export interface ColumnDef {
  id: ColumnId
  label: string
  align: "left" | "right"
  tooltip?: string
  sortValue?: (grant: GrantWithCompany) => number | string
  renderCell: (grant: GrantWithCompany) => ReactNode
  renderFooter?: (totals: ColumnTotals) => ReactNode
}

export interface ColumnConfig {
  id: ColumnId
  visible: boolean
}

// A cell with nothing to show says so quietly
const none = <span className="text-ink-muted">n/a</span>

function months(count: number): string {
  return count === 1 ? "1 month" : `${count} months`
}

export const COLUMN_DEFS: Record<ColumnId, ColumnDef> = {
  grantDate: {
    id: "grantDate",
    label: "Grant date",
    align: "left",
    tooltip: "The date the grant was made",
    sortValue: (grant) => grant.grantDate.getTime(),
    renderCell: (grant) => formatDate(grant.grantDate),
  },
  schedule: {
    id: "schedule",
    label: "Schedule",
    align: "left",
    tooltip: "How often shares vest: monthly, quarterly or yearly",
    sortValue: (grant) => grant.vestingSchedule,
    renderCell: (grant) => SCHEDULE_LABELS[grant.vestingSchedule],
  },
  vestingPeriod: {
    id: "vestingPeriod",
    label: "Vesting period",
    align: "right",
    tooltip: "How long the shares take to vest in full",
    sortValue: (grant) => grant.vestingPeriodMonths,
    renderCell: (grant) => months(grant.vestingPeriodMonths),
  },
  cliff: {
    id: "cliff",
    label: "Cliff",
    align: "right",
    tooltip: "The period before any shares vest",
    sortValue: (grant) => grant.cliffMonths,
    renderCell: (grant) => months(grant.cliffMonths),
  },
  shares: {
    id: "shares",
    label: "Shares",
    align: "right",
    tooltip: "The number of virtual shares in the grant",
    sortValue: (grant) => grant.grantedAmount,
    renderCell: (grant) => shares(grant.grantedAmount),
    renderFooter: (totals) => shares(totals.totalGrantedAmount),
  },
  value: {
    id: "value",
    label: "Value",
    align: "right",
    tooltip: "The value of the shares when the grant was made",
    sortValue: (grant) => grant.vsopsValue,
    renderCell: (grant) => euroPrecise(grant.vsopsValue),
    renderFooter: (totals) => euroPrecise(totals.totalVsopsValue),
  },
  strikePrice: {
    id: "strikePrice",
    label: "Strike price",
    align: "right",
    tooltip:
      "The price per share you pay to exercise. The total is the strike price times the shares",
    sortValue: (grant) => grant.vsopsStrikePrice,
    renderCell: (grant) => euroPrecise(grant.vsopsStrikePrice),
    renderFooter: (totals) => euroPrecise(totals.totalStrikeCost),
  },
  netValue: {
    id: "netValue",
    label: "Net value",
    align: "right",
    tooltip:
      "Value minus the total strike price: what exercising would leave you, before tax",
    sortValue: (grant) =>
      grant.vsopsValue - grant.vsopsStrikePrice * grant.grantedAmount,
    renderCell: (grant) =>
      euroPrecise(
        grant.vsopsValue - grant.vsopsStrikePrice * grant.grantedAmount
      ),
    renderFooter: (totals) =>
      euroPrecise(totals.totalVsopsValue - totals.totalStrikeCost),
  },
  appreciation: {
    id: "appreciation",
    label: "Appreciation",
    align: "right",
    tooltip:
      "How the company's price per share has changed since the grant was made",
    sortValue: (grant) =>
      grant.appreciation !== undefined ? (grant.appreciation - 1) * 100 : 0,
    renderCell: (grant) => {
      if (grant.appreciation === undefined) return none
      const pct = (grant.appreciation - 1) * 100
      return `${pct >= 0 ? "+" : "−"}${percentPrecise(Math.abs(pct), 2)}`
    },
  },
  ownership: {
    id: "ownership",
    label: "Ownership",
    align: "right",
    tooltip:
      "The share of the company this grant stands for, against the latest share count on record",
    sortValue: (grant) => grant.ownership ?? 0,
    renderCell: (grant) =>
      grant.ownership !== undefined
        ? percentPrecise(grant.ownership, 4)
        : none,
    renderFooter: (totals) =>
      totals.totalOwnership !== undefined
        ? percentPrecise(totals.totalOwnership, 4)
        : none,
  },
}

export const DEFAULT_COLUMN_CONFIG: ColumnConfig[] = [
  { id: "grantDate", visible: true },
  { id: "schedule", visible: false },
  { id: "vestingPeriod", visible: false },
  { id: "cliff", visible: false },
  { id: "shares", visible: true },
  { id: "value", visible: true },
  { id: "strikePrice", visible: true },
  { id: "netValue", visible: true },
  { id: "appreciation", visible: true },
  { id: "ownership", visible: true },
]
