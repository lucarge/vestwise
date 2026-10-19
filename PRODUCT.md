# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Employees of European startups, largely German-speaking markets, who hold virtual stock options (VSOPs). They signed a VSOP agreement with share counts, a strike price, a cliff and a vesting period, often have more than one grant (hire grant plus refresh), and have no clear idea what any of it is worth. Their job: know what has vested, when the rest vests, and what the options could realistically be worth in euros.

## Product Purpose

VestWise turns the terms of a VSOP grant into real numbers: the vesting schedule, today's net value, and a simulated value at any future company valuation after dilution. Success for the landing page is a visitor opening the app (app.vestwise.app) and entering a first grant; success for the product is that visitor leaving with a euro figure they understand.

## Positioning

Built for virtual stock options in euros, not US ISO/NSO/RSU tooling. Equity is expressed as net value (value minus total strike cost) and stress-tested against valuation multiples and funding-round dilution, instead of headline share counts. Everything runs in the browser: no account, no backend, and the source is public under MIT.

## Operating Context

Visitors arrive holding a VSOP agreement or grant letter (usually a PDF) and know, or can look up, grant date, number of shares, strike price, cliff and vesting period, plus the company's last pre-money valuation and amount raised. Typical moments (inferred, not confirmed): a funding announcement at an all-hands, a refresh grant, comparing job offers, or deciding whether to stay.

## Capabilities and Constraints

- Grant fields: grant date, vesting schedule (Monthly / Quarterly / Yearly), vesting period in months (default 48), cliff in months (default 12), number of shares, value in EUR (total or per share), strike price in EUR (must be above 0). Shares vest every 1, 3 or 12 months; at the cliff all accrued shares release at once, then linearly.
- Dashboard: a plain-language summary sentence (vested shares, net value, total value, fully-vested date), "Cumulative Vesting" (Shares / Value), "Yearly Vesting Summary" (bars plus table), and one chart per grant with "Cliff" and "Today" markers and a "Fully Vested" badge.
- Grants table with configurable columns, including Net Value, Appreciation and Ownership.
- Company Valuations: pre-money valuation history with optional amount raised; cumulative dilution is calculated from funding rounds; each grant is matched to the latest valuation on or before its grant date.
- Stock Potential: "Multiplier" (0.5x to 20x, default 2x) or "Absolute Valuation" mode, dilution 0 to 75% prefilled from funding rounds, cards for Current Net Value, Simulated Net Value, Net Gain and Dilution Impact, and a "Value by Valuation Multiple" chart.
- Settings: Light / Dark / System theme, JSON export and import, and an optional connected file that auto-saves after every change (Chromium browsers only; the file can sit in an iCloud Drive or Google Drive folder, but the app itself never talks to those services).
- Constraints: EUR only, English only, virtual stock options only. No tax calculation, exercise tracking, liquidation-preference waterfalls, acceleration or leaver rules, sharing links, accounts, or cloud sync service.
- Free, no sign-up.
- Terminology: grant, shares, vested / unvested, cliff, strike price, net value, valuation multiple, dilution, Stock Potential.

## Brand Commitments

- The name "VestWise" is the only binding brand element. The user confirmed the logo, tagline, palette, visual kinship with the app, and the theme toggle are all open to change.
- Domains: vestwise.app (landing) and app.vestwise.app (app).

## Evidence on Hand

- The working product, from which live demonstrations can be built with synthetic sample data (label it as sample).
- Public GitHub repository under MIT: https://github.com/lucarge/vestwise
- No testimonials, user counts, press, ratings or customer logos exist. Future work must not fabricate any.
- Privacy precision: grant and valuation data never leave the browser (no backend, no network calls in the app). Both sites do run cookieless Vercel Web Analytics page views, so "no tracking" or "no analytics" claims are false.

## Product Principles

1. Real numbers over share counts: equity is shown as euros, net of strike price and dilution.
2. Honest simulation: projections are labeled as projections; no tax or investment advice.
3. Your data stays on your device: no account, no server; backups go to a file the user owns.
4. Speak VSOP: use the language of European startup equity, not US equity jargon.
