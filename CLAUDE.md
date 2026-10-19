# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VestWise (vestwise.app) — stock option vesting tracker. This is a **Bun workspaces monorepo** with three packages:

- **`packages/app`** — The main app (app.vestwise.app). Client-only React + TypeScript that lets users fill in grant details via a form and displays metrics and graphs for the vesting schedule.
- **`packages/landing`** — Marketing landing page (vestwise.app). A single page styled as a sample VSOP agreement whose blanks are live inputs, annotated in euros by VestWise.
- **`packages/brand`** — The brand primitives both of them render, as sources: a stylesheet with the tokens and component classes, and the components, hooks and formatters. No build step; the other two depend on `@vestwise/brand` and import it directly.

## Tech Stack

- React 19 + TypeScript (strict mode, `noUnusedLocals`/`noUnusedParameters` enabled)
- Vite 7 (build tool)
- Bun (package manager & runtime, workspaces)
- shadcn/ui v4 (base-nova style, built on Base UI + Tailwind CSS v4) — app only; the landing uses its own components on Tailwind CSS v4
- One brand for both packages, written down in `DESIGN.md` at the repo root: paper, ink and one highlighter yellow as OKLCH tokens; Archivo for VestWise's voice and Source Serif 4 for the agreement's (self-hosted via `@fontsource-variable`); 1px ink rules instead of cards, square corners, tabular figures; shipped to both as `packages/brand`
- No backend — all logic runs client-side

## Common Commands

Run from the **repo root**:

```bash
bun run dev              # Start both dev servers in parallel
bun run dev:app          # Start app only (port 5173)
bun run dev:landing      # Start landing only (port 5174)
bun run build            # Build both packages
bun run build:app        # Build app only
bun run build:landing    # Build landing only
bun run lint             # Run ESLint across all packages
bun run typecheck        # Type-check all packages
bun run format           # Format all .ts/.tsx with Prettier
```

## Architecture

### App (`packages/app`)

- **Form layer**: Collects VSOP grant details (grant date, total shares, vesting period, cliff, etc.)
- **Calculation layer**: Pure functions that compute vesting schedules, milestones, and metrics from grant inputs
- **Visualization layer**: Charts and summary metrics displaying vested/unvested shares over time

- **Visual layer**: the app is an Operate surface of the brand (`DESIGN.md`, section "App surfaces"): a restyled shadcn sidebar, pages built from `PageHeader` and `Part` (`src/components/brand/`), the grant form as a § 1 clause with inline blanks, Stock Potential as the one highlighter field, and Recharts restyled as the landing's exhibit (`src/components/charts/`). `src/index.css` binds every shadcn variable to the brand tokens.
- **Brand**: the wordmark, highlighter, blanks, ruler, rolling figures, reduced-motion hook, formatters and `fitFigure` are imported from `@vestwise/brand` (see Brand below); `src/components/brand/` keeps only the app's own `BlankDate` (built on the shadcn Calendar and Popover), `PageHeader` and `Part`.

All state is local — no API calls, no database. Grants, valuations and settings persist in `localStorage` (keys like `vsop-grants`; see `src/hooks/use-grants.ts` and `src/lib/backup-data.ts`). The only URL input is the landing's grant link, `/grants/new#grant=<encoded>` (`src/lib/grant-handoff.ts`): it is read and removed from the address bar before the first render, and only prefills the Add Grant form; nothing is saved until the user adds the grant.

### Landing (`packages/landing`)

One document-style page: a sample VSOP agreement whose blanks are live inputs, with VestWise's figures in the margin. A React context (`src/lib/terms.tsx`) carries the visitor's terms through every section. The vesting and payout math in `src/lib/vesting.ts` is ported from the app (`packages/app/src/lib/vesting.ts` and `potential.ts`) — keep them in sync. Once the visitor edits the terms, and as long as the app would accept them, every "Open the app" link carries them in the URL fragment; the encoder in `src/lib/handoff.ts` is ported from `packages/app/src/lib/grant-handoff.ts`, whose tests pin the format — keep them in sync too. No routing, no persistence. The wordmark, highlighter, blanks, ruler, rolling figures, reduced-motion hook and formatters come from `@vestwise/brand`; `src/components/brand.tsx` keeps only the landing's own `OpenApp` and `REPO_URL`.

Design context lives at the repo root in `PRODUCT.md` (the product record) and `DESIGN.md` (the design system), shared by both packages; each package keeps its own surface brief under `.impeccable/surfaces/`. The impeccable skill resolves them upward from either package.

### Brand (`packages/brand`)

The primitives the landing and the app share, consumed as sources: the `exports` in its `package.json` point at `src/index.ts` and `src/brand.css`, which Vite and `tsc` read through the workspace symlink. There is no build; `bun run typecheck` checks the package on its own (`tsc -b` on its `tsconfig.json`) and again inside each consumer.

- `src/brand.css` — the seven OKLCH tokens (`--paper`, `--ink`, `--ink-soft`, `--ink-muted`, `--hairline`, `--mark`, `--mark-ink`), `--line` with its 1024px step, the easings, the two self-hosted fonts with their `@theme` bindings (`font-sans`, `font-serif`, the seven colours, `spacing-line`), and the component classes (`.voice-*`, `.figures`, `.mark`, `.blank`, `.ruler`, `.roll*`, `.text-link`, `.fit-figure`). The light values sit on `:root`; the dark ones are written with `@variant dark`, so each package keeps its own switching mechanism by defining `@custom-variant dark` in its `src/index.css` (the landing: `prefers-color-scheme`; the app: the `.dark` class its theme provider sets). Import it after `tailwindcss`, and add `@source "../../brand/src"` so Tailwind scans the package's class names.
- `src/index.ts` — `Wordmark` and `WordmarkBar`, `Mark` (load and scroll sweeps), `RollingNumber`, `BlankNumber` and `BlankSelect`, `Ruler` with its scale (`MULTIPLE_RANGE`, `MULTIPLE_TICKS`, `DILUTION_TICKS`, `MULTIPLE_STEPS`, `multipleFromPosition`, `positionFromMultiple`, `stepMultiple`), `prefersReducedMotion` and `useReducedMotion`, the visitor-locale formatters (`euro`, `euroPrecise`, `euroCompact`, `shares`, `amount`, `multiple`, `percent`, `percentPrecise`, `decimal`, `month`, `shortMonth`, `formatDate`, `formatDateLong`, `parseAmount`, `LOCALE`) and `fitFigure`.
- No `@/` alias here: the package imports its own files relatively and keeps a private `cn`. Each consumer keeps its own `cn`, base layer and additions (the app's `BlankDate`, `PageHeader`, `Part`, `.field-blank` and shadcn bindings; the landing's `OpenApp`, `.btn`, `.redline` and load sequence). A change here changes both sites: check both dev servers, light and dark.

## Conventions

- Path alias: `@/` maps to `src/` in the app and the landing (configured in both tsconfig and vite); `packages/brand` has none and imports relatively
- Anything both sites render belongs in `packages/brand`, not in a copy per package
- Add shadcn components via: `cd packages/<name> && bunx shadcn@latest add <component>`
- UI primitives live in `src/components/ui/`; app components in `src/components/`
- Shared tooling (eslint, prettier) lives at the repo root
- Each package has its own `package.json`, `vite.config.ts`, `tsconfig.json`, and `vercel.json`

## Deployment

Two separate Vercel projects, same GitHub repo:

- **vestwise-app**: Root directory `packages/app`, domain `app.vestwise.app`
- **vestwise-landing**: Root directory `packages/landing`, domain `vestwise.app`

Both builds read `packages/brand` next to their root directory, so each project must include source files outside its root directory, and each `vercel.json` ignore command also watches `packages/brand/`: a brand change redeploys both sites.
