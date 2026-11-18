# F25 — the held stop keeps its whole nudge frame

## .the fork

- **A.** acceptance case8 [t0] and integration case3 [t3] each snap the whole frame a held stop prints: the face's nudge, its exit, and its stderr
- **B.** keep the whole frame at integration only; in acceptance, assert the exit and the stable seams (`time again, to tend the terms`, `stale (> 1 hour)`)

## .taken — A

the held stop is the one critipath where the toggle's entry meets the face it calls, and what a clone sees there is the whole point of `enable`. a snapshot is what lets a reviewer vibecheck that view and what catches drift in it (`rule.require.snapshots`, `rule.require.snapshot-every-journey-step`). acceptance runs the frame through the published `npx rhx` path; integration runs it through the cli wrapper. each proves a different boundary, so each keeps its frame.

when feat-subconscious-term-distill edits the face's copy, the two snaps change with it. that resnap is the visible cost of a copy change, and a reviewer reads it at that pr. it is not a false red.

## .rework — clean

swap one `toMatchSnapshot` in acceptance case8 [t0] for two `toContain` asserts. no prod change.

## .confidence — 80%, why not higher

the reviewer's point is real: the face is out of this pr's scope, and two frames double its resnap cost. whether a journey snapshot should pin bytes it does not own is a matter of taste.

## .where

`blackbox/learner.terms.hook.journey.acceptance.test.ts` (case8 [t0]) · `src/contract/cli/learn.terms.hook.integration.test.ts` (case3 [t3])
