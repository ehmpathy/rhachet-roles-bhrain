# F19: main's live-suite gates over `RHACHET_LIVE_BRAIN`

## .the fork

the rebase onto main met #661, which gates each live suite by its own flag (`BHRAIN_TEST_LIVE_BRAIN_SONNET`, `_CACHE`, `_TALLY`). keep this branch's `RHACHET_LIVE_BRAIN` gate the director ordered, or take main's?

## .taken: main's flags; `RHACHET_LIVE_BRAIN` and `isLiveBrainTargeted` dropped

two gates on one suite is a synonym pair with two truths. main's already ships and gates the same two suites the director named.

## .rework: clean

one helper and its test, re-added from the branch history.

## .confidence: 90%

the director's order named an outcome (the unfunded suites stop going red), and main's gate meets it. the 10% is that the director meant the name too.

## .where

`src/.test/infra/isLiveBrainTargeted.ts` (deleted); `.dream/v2026_11_01.gate.live-api-suites-name-their-gate.md` `.what landed`.

## .verdict

open.
