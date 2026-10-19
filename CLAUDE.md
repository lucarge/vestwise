# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VestWise (vestwise.app) — stock option vesting tracker. This is a **Bun workspaces monorepo** with two packages:

- **`packages/app`** — The main app (app.vestwise.app). Client-only React + TypeScript that lets users fill in grant details via a form and displays metrics and graphs for the vesting schedule.
- **`packages/landing`** — Marketing landing page (vestwise.app). A single page styled as a sample VSOP agreement whose blanks are live inputs, annotated in euros by VestWise.

## Tech Stack

- React 19 + TypeScript (strict mode, `noUnusedLocals`/`noUnusedParameters` enabled)
- Vite 7 (build tool)
- Bun (package manager & runtime, workspaces)
- shadcn/ui v4 (base-nova style, built on Base UI + Tailwind CSS v4) — app only; the landing uses its own components on Tailwind CSS v4
- One brand for both packages, written down in `DESIGN.md` at the repo root: paper, ink and one highlighter yellow as OKLCH tokens; Archivo for VestWise's voice and Source Serif 4 for the agreement's (self-hosted via `@fontsource-variable`); 1px ink rules instead of cards, square corners, tabular figures
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
- **Ported from the landing, keep in sync**: `src/components/brand/{wordmark,mark,rolling-number,blank,ruler,ruler-scale}`, `src/hooks/use-reduced-motion.ts`, `src/lib/format.ts` and `fitFigure` in `src/lib/utils.ts` mirror their counterparts in `packages/landing/src`.

All state is local — no API calls, no database. Grants, valuations and settings persist in `localStorage` (keys like `vsop-grants`; see `src/hooks/use-grants.ts` and `src/lib/backup-data.ts`). The only URL input is the landing's grant link, `/grants/new#grant=<encoded>` (`src/lib/grant-handoff.ts`): it is read and removed from the address bar before the first render, and only prefills the Add Grant form; nothing is saved until the user adds the grant.

### Landing (`packages/landing`)

One document-style page: a sample VSOP agreement whose blanks are live inputs, with VestWise's figures in the margin. A React context (`src/lib/terms.tsx`) carries the visitor's terms through every section. The vesting and payout math in `src/lib/vesting.ts` is ported from the app (`packages/app/src/lib/vesting.ts` and `potential.ts`) — keep them in sync. Once the visitor edits the terms, and as long as the app would accept them, every "Open the app" link carries them in the URL fragment; the encoder in `src/lib/handoff.ts` is ported from `packages/app/src/lib/grant-handoff.ts`, whose tests pin the format — keep them in sync too. No routing, no persistence.

Design context lives at the repo root in `PRODUCT.md` (the product record) and `DESIGN.md` (the design system), shared by both packages; each package keeps its own surface brief under `.impeccable/surfaces/`. The impeccable skill resolves them upward from either package.

## Conventions

- Path alias: `@/` maps to `src/` in each package (configured in both tsconfig and vite)
- Add shadcn components via: `cd packages/<name> && bunx shadcn@latest add <component>`
- UI primitives live in `src/components/ui/`; app components in `src/components/`
- Shared tooling (eslint, prettier) lives at the repo root
- Each package has its own `package.json`, `vite.config.ts`, `tsconfig.json`, and `vercel.json`

## Deployment

Two separate Vercel projects, same GitHub repo:

- **vestwise-app**: Root directory `packages/app`, domain `app.vestwise.app`
- **vestwise-landing**: Root directory `packages/landing`, domain `vestwise.app`
