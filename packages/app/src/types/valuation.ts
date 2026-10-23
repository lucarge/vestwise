// One dated set of a company's figures. Any two of the valuation, the share
// count and the price per share give the third, so only what was typed is kept
export interface ValuationEntry {
  id: string
  date: Date
  /** Post-money, in euros */
  valuation?: number
  /** Fully diluted, after the round */
  shares?: number
  pricePerShare?: number
  amountRaised?: number
  /** The grant this price was recorded from; it follows the grant's edits */
  grantId?: string
}
