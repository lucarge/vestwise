---
version: 1
slug: "src-components-app-layout-tsx"
primary_target: "src/components/app-layout.tsx"
related_targets: ["src/components/app-sidebar.tsx", "src/pages/dashboard.tsx", "src/pages/grants.tsx", "src/pages/new-grant.tsx", "src/pages/companies.tsx", "src/pages/potential.tsx", "src/pages/settings.tsx", "index.html"]
---

# Surface brief: app.vestwise.app

Scope: the product at app.vestwise.app (packages/app). Visitor mode: Operate.

Audience and job: employees of European startups holding VSOPs who have entered, or are about to enter, their grants. They come back to read what has vested in euros, add a refresh grant or a funding round, and try an exit scenario. Proof: the app's own maths on their own terms; nothing leaves the browser. Constraints: claims stay inside PRODUCT.md; EUR only; every stored key, the grant link hand-off, the connected-file backup, column configuration and the theme setting keep working as they are (the old `vsop-valuations` key, older backups and older connected files upgrade once to companies, in `vsop-companies`).

Memorable moment: the grant is a clause. Adding or editing a grant means filling the blanks of the agreement's own sentence, and the margin answers in euros as you type. A grant link from vestwise.app opens that same sentence already filled in.

Hand-off: `/grants/new#grant=<encoded>` from the landing prefills the clause (see `src/lib/grant-handoff.ts`); nothing is saved until the Participant adds the grant.

## Direction contract

THESIS: A working product in the landing's materials. The world (DESIGN.md at the repo root: paper, ink, one highlighter; Archivo for VestWise, Source Serif 4 for the agreement) lends type, palette, density and one signature move. Navigation and controls stay standard: a sidebar, tables with sortable headers, tabs, selects, a date picker, dialogs.

OWN-WORLD: inherited from DESIGN.md with two amendments for an app: `hairline` may rule the body rows of a table (they are gridlines), and one state colour (`state`) exists for errors and irreversible actions only, never for a figure. Money carries direction with signs and words, not green or red. The 7% ink wash is the one derived surface (hover, selection, the tab ground). No cards, shadows, gradients or radii: parts open with a 1px ink rule on the clause line.

STORY: The Participant lands on the dashboard: the net value vested today under the highlighter, the schedule drawn as Annex A with the Today flag, the yearly ledger, then every grant as its own clause and exhibit. Grants is the table of record. Add a grant is § 1 with blanks and a margin figure. Companies holds a part per company: today's figures in a sentence, its valuations as a ledger, its price per share as an exhibit. Stock Potential is the one highlighter field: rulers left, the payout ledger right. Settings is plain and ruled.

FIRST VIEWPORT: Sidebar on paper with a 1px ink edge: the wordmark, Dashboard, Grants, Companies, Stock Potential, Settings; the current page carries a 0.25rem yellow bar. Content in a 1320px frame: the page title in the display voice, a lede in soft ink, then the first part under its rule. On the dashboard that part is "Net value vested today" with the figure rolling up once under the highlighter, the share sentence and the fully-vested date. Motion grammar: state feedback only (140 to 160ms ease-out), figures roll when their inputs change, the exhibit draws once; no page-load sequence; everything gated by `prefers-reduced-motion`.

FORM: The Marked-Up Agreement, extended to an Operate surface. seed: the landing's shipped identity.

FINISH: unreviewed and undocumented is unfinished; the build ends with a bounded review round (desktop and mobile, day and night), the mechanical detector, and DESIGN.md extended with the app's components.
