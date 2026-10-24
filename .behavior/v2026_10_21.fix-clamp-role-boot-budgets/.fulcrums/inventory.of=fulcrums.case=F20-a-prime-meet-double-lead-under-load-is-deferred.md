# F20 — a prime meet double lead under host load is deferred

## .the fork

`genReviewPrefixPrime` `[case7]` saw two leaders once, under a loaded host, and passed 4 of 4
unloaded. either diagnose it in this PR, or catch it as a dream and ship.

## .taken, and why at the time

deferred to `.dream/v2026_10_22.fix.two-lanes-lead-one-prime-meet-under-load.md`.

- the prime meet is shipped code on main; this PR does not touch it
- the cause is undecided between a designed takeover (a hold wait past `msOfAwait`) and a double
  hold in `with-simple-mutex` / `simple-on-disk-cache` — the second lands in another package
- the harm is one extra one-token poke on the meets that hit it

🟡 its peer, the solo double stamp, was NOT deferred: it was small, safe, and clean (one guard in
`genReviewPrefixPrime`, a clamp in `[case11]`), so it was fixed in this PR. only the double lead
stays here.

## .rework

dirty — a fix may move into another package, or change the meet's await semantics.

## .confidence — 70%

the load explanation rests on one red run against four green ones. a double hold would be a real
lock defect that this PR ships beside, unaddressed.

## .where

`src/domain.operations/review/prime/meet/genPartOfMeet.ts` ·
`src/domain.operations/review/prime/genReviewPrefixPrime.integration.test.ts` `[case7]`

## .verdict

open.
