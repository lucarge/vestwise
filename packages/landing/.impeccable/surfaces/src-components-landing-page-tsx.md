---
version: 1
slug: "src-components-landing-page-tsx"
primary_target: "src/components/landing-page.tsx"
related_targets: ["index.html"]
---

# Surface brief: vestwise.app landing

Scope: the marketing landing at vestwise.app (packages/landing). Visitor mode: Persuade.

Audience and job: employees of European startups holding VSOPs who want to know what their grant is worth. Action: enter their terms and open the app (app.vestwise.app). Proof: the product's own math running live on the page; the public MIT repo. Constraints: claims stay inside PRODUCT.md; sample figures are labeled as sample; no testimonials, counts or logos.

Memorable moment: typing your own numbers into the blanks of a contract and watching the margin answer in euros, with those numbers carried through the whole document, down to the closing redline.

Hand-off: once the visitor edits the terms, every Open the app link carries them to the app's Add Grant form in the URL fragment, which browsers never send to a server; the app fills in the form and saves nothing until the visitor adds the grant. Sample terms, and terms the app would refuse, keep the plain link. The Participant's caption says when the terms come along.

## Direction contract

THESIS: The page is a sample VSOP grant agreement that VestWise annotates in the margin, clause by clause, in euros. It refuses the category default: headline beside a tilted dashboard screenshot, gradient fields, a row of feature cards.

OWN-WORLD: Laser-paper white (dark: graphite night-reading sheet), near-black ink, legal grey for receded clauses, and one fluorescent highlighter yellow used only as flat full-strength fields. Two voices: the agreement in Source Serif 4 (clauses, § headings, sub-clauses); VestWise in Archivo semi-expanded heavy (headline, figures, margin glosses, controls). 1px ink rules and whitespace separate; no cards, no shadows, square corners. Editable blanks are bold underlined inputs.

STORY: The visitor recognises their own agreement, types their terms into the blanks, reads vested net value and an exit figure in euros, follows the clauses (vesting annex, exit and dilution, data protection sub-clauses) with their numbers carried through, sees the closing redline strike their share count into euros, then signs by opening the app.

FIRST VIEWPORT: Letterhead row: wordmark left; Vesting, Exit, Privacy, GitHub, Open the app right, under a full-width rule. Headline "Put a real number on your VSOP." up to 7.5rem across about nine tenths of the width, VSOP highlighted, then a one-line instruction. Below, § 1 Grant in 26px serif with seven live blanks on the left, and the Participant's signature line under it carrying Open the app. Right of a vertical rule, the margin: label, highlighted vested net value up to 4.75rem (the widest the semi-expanded figures fit the margin), a short line of shares and date, and a second figure for a 3x exit after dilution that links to § 3. Signature interaction: editing a blank highlights it and rolls every figure digit by digit. Motion grammar: one load sequence (rule draws, headline unmasks, highlighter sweeps, figure rolls up), then reading focus on scroll, highlighter sweeps on key phrases, the annex drawing once, and the closing redline striking through; reduced motion swaps all of it for instant states. In dark mode the § 3 field is held to the sheet's measure.

FORM: The Annotated Agreement, position 3 on the ordered list. seed: none (unavailable)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
