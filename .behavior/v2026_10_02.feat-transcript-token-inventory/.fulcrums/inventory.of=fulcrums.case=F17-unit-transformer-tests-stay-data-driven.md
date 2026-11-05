# F17 — the new unit tests of pure transformers stay data-driven caselists

## .the fork

i001 r007 (`mech-given-when-then`, blocker.1) names 20 new unit suites that use
`describe` + a `TEST_CASES` table + `test`, and asks each be rewritten into `given` / `when` /
`then`. two choices:

- **A** — concede, and rewrite all 20
- **B** — dispute: the cited rule does not require the shape for a unit test, and a peer rule
  prefers the caselist for exactly these files

## .taken — B, and why at the time

- the cited rule's own `.where` reads *"required: integration tests"* and *"recommended: unit
  tests, readability"* — a unit suite in the caselist shape is not a violation of it
- `rule.prefer.data-driven` (ehmpathy/mechanic) asks for this exact shape — *"prefer data-driven
  caselist tests when possible, especially unit tests of transformers"* — and its example is a
  `TEST_CASES` array mapped through `describe` + `test`
- all 20 files test pure transformers (`as*`, `is*`, `compute*`, `format*`) — the class that rule
  names. every integration and acceptance suite this branch adds uses `given` / `when` / `then`
- the rewrite carries real risk for no shipped gain: 20 files, each case moved by hand, each a
  chance to drop or alter a case

## .rework — clean

if the council rules A: each table maps into `given(case.description, () => when('[t0] …',
() => then(…)))` — a mechanical change per file, no prod code moves.

## .confidence — 85%, and why it is not higher

if the org intends `given` / `when` / `then` for every suite, the two rules disagree and the
council must say which one binds; the word `recommended` is the evidence it does not.

## .where

- the 20 files listed in `.reviews/peer/5.3.verification._.review.i001.*.r007.*.given.by_peer.mech-given-when-then.report.md`

## .verdict

open — for the council.
