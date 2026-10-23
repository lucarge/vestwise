import type { ValuationEntry } from "@/types/valuation"

export interface Company {
  id: string
  name: string
  /** The strike price per share new grants start from */
  strikePrice?: number
  valuations: ValuationEntry[]
}
