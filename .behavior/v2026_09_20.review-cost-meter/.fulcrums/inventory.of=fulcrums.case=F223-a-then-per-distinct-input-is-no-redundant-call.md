# F223 — a then per distinct input is no redundant call

## .the fork

`rule.forbid.redundant-expensive-operations` forbids the SAME operation, with the SAME input, re-run
across adjacent `then` blocks. a lane flagged two shapes under it:

- `setOutputArtifacts.integration.test.ts [case1]` — three `then` blocks, each calls the operation
  with **distinct** args (the lane's own words: *"not strictly identical inputs"*)
- `getAllResultsInBoundedPool.test.ts [case5]` — **one** `then`, **one** pour, two assertions on
  its result

two answers: **(a)** fold each into a shared `useThen` · **(b)** hold — neither re-runs one act

## .taken

**(b)**. a `then` that varies the input is a distinct act, and a shared result would erase the
variation the case exists to prove. a `then` with one call and two `expect`s calls once. the rule's
detection pattern — the same async call in multiple adjacent `then` blocks — matches neither.

the one true instance on the lane, `getAllSettledResultsInBoundedPool.test.ts [case1]` (the same
items and map re-poured in three `then` blocks), was repaired with `useThen`.

## .rework

**clean.** a `useThen` fold is local to one case.

## .confidence

🟢 **92%** — both shapes read against the rule's own detection pattern, 2026-10-12.

## .where

`src/domain.operations/review/setOutputArtifacts.integration.test.ts` ·
`src/utils/getAllResultsInBoundedPool.test.ts`

## .verdict

unruled — awaits the council.
