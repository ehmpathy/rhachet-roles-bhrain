# F4 — defer the top-up count mismatch to a dream

## .the fork

the drive halt prints `--add N`, and the judge urgent halt prints `--add 2`. options:

- **a.** leave the count as is; catch it as a dream (`.dream/v2026_11_21.fix.one-top-up-count-on-every-urgent-surface.md`)
- **b.** fold it into this pr: the drive halt reads `ROUNDS_OFFERED_ON_TOPUP`

## .taken, why

a. the wish covers the owner, not the count. b ripples into the drive-halt snapshots. the gate makes a double run safe (`rounds-remain`), so no harm ships while the count waits.

## .rework

clean: a one-line change and a snapshot refresh, later or in this pr if a reviewer asks.

## .confidence, why low

75%: b is small, and a reviewer may call it a safe, clean fix that the scouts' honor rule says to pull in now.

## .where

`formatBlockRemedyGroups.ts:105,115`, `formatReviewBudgetTopupCommand.ts:10`

## .verdict

redirected by the foreman to b: folded in. `N` was the literal a human fills; with the lever the driver's, it is a step the driver must decode. the drive halt now reads `ROUNDS_OFFERED_ON_TOPUP` (`formatBlockRemedyGroups.ts`), `'N'` left the `add` type of `formatReviewBudgetTopupCommand`, and the invariant's enforcement reads "command" again. 72 snapshot lines across 19 files moved `--add N` → `--add 2`, and no other byte; each resnap suite ran green (unit 88, integration 196, acceptance 519). the dream is deleted.