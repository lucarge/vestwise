# VestWise

**Your stock options, finally clear.**

VestWise helps you understand your equity. Track vesting schedules, visualize milestones, and model what your options could be worth — all without creating an account. Your data never leaves your browser.

**[Open the app](https://app.vestwise.app)** | **[Landing page](https://vestwise.app)**

## Features

- **Dashboard** — See your total equity at a glance with cumulative vesting charts across all grants
- **Grant management** — Add and manage multiple grants with different cliff dates, vesting periods, and share counts
- **Company valuations** — Track valuation history and funding rounds, with automatic dilution calculations
- **Stock potential** — Model what your options could be worth under different scenarios and growth assumptions
- **Privacy-first** — No backend, no tracking, no sign-up. Everything runs client-side and stays in your browser

## Tech stack

- React 19 + TypeScript
- Vite 7
- Bun (package manager & runtime)
- shadcn/ui (Base UI + Tailwind CSS v4)
- Recharts for data visualization

## Project structure

This is a Bun workspaces monorepo:

- **`packages/app`** — The main application ([app.vestwise.app](https://app.vestwise.app))
- **`packages/landing`** — Marketing landing page ([vestwise.app](https://vestwise.app))
- **`packages/brand`** — The brand primitives both share (tokens, components, formatters), consumed as sources

## Getting started

```bash
# Install dependencies
bun install

# Start both dev servers
bun run dev

# Or start individually
bun run dev:app      # port 5173
bun run dev:landing  # port 5174
```

## Build

```bash
bun run build          # Build both packages
bun run lint           # Run ESLint
bun run typecheck      # Type-check all packages
bun run format         # Format with Prettier
```

## License

[MIT](LICENSE)
