# F11 — the review subsystem's `genTokenBreakdown*` keeps its name

## .the fork

the repo-rules reviewer (i002 r001, nitpick.2) noted that this route declares `breakdown` a
forbidden synonym of `transcript.token.inventory`, and that this diff touches
`genTokenBreakdownReport.ts` and `genTokenBreakdownMarkdown.ts` (each swapped a local token
formatter for the shared `asTokenCountHuman`). two choices:

- **A — rename them** to `genTokenInventory*`, with `TokenBreakdownEntry` and every caller
- **B — keep the names** and record that the review split is a different concept, in a different
  boundary, from `transcript.token.inventory`

## .taken — B, and why at the time

- the two answer different questions. `transcript.token.inventory` is what a transcript's context
  HELD, call over call, measured from metered usage. the review split is an ESTIMATE of one prompt
  not yet sent — rules vs targets, by directory, from bytes. no call, no hold, no meter
- `rule.require.boundary-qualified-terms` makes the forbid boundary-scoped: the term file is
  `transcript.token.inventory`, so its forbidden synonyms bind within `transcript.token`. the
  review split lives in the `review` boundary, where no `inventory` term is declared
- a rename to `inventory` there would OVERLOAD the word this route just settled — a review estimate
  and a transcript hold under one name — which `rule.forbid.domain-term-ambiguity` forbids
- the touch was a formatter swap; neither contract's shape or sense changed

## .rework — clean

if the council rules A, the rename is three exports and their call sites, all in
`src/domain.operations/review/`, through `sedreplace`.

## .confidence — 75%, and why it is low

the reviewer read the forbid as repo-wide. if the glossary intends synonyms to bind across
boundaries, the review split needs its own term (`review.token.split` or similar) rather than
`inventory`, and B leaves it unnamed.

## .where

- `src/domain.operations/review/genTokenBreakdownReport.ts`
- `src/domain.operations/review/genTokenBreakdownMarkdown.ts`
- `.agent/repo=.this/role=any/briefs/domain.terms/term=transcript.token.inventory._.choice.reason.md`

## .verdict

open.
