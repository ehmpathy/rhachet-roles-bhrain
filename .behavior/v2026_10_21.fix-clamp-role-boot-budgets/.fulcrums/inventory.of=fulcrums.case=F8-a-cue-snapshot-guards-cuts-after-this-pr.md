# F8 — a durable snapshot of booted cue lines guards cue cuts after this pr

## the fork

- **A** — the census diff guards this pr only. after it, the mins are the new baseline, and a
  later cue cut is caught by naught (the budget sees growth, never a cut)
- **B** — add one integration test that snapshots each role's booted cue lines, with the same
  classifier `rhx census.cues` uses. a later cut, or a deleted rule, is a snapshot diff in review

the same test file carries a second, cheaper check, added at i005 for inventory cell 13: every
cue row of a min appears verbatim in its `.md`, or is a reflow recorded beside the test. so a
later edit to a rule's `.md` cue that skips its min fails too.

## taken: B, and why

both peer lanes at i004 raised it independently: a cue cut is possible by nature, so a one-time
check leaves the forbidden state unguarded the day after the pr ships. the snapshot pattern is
this repo's standard way to make an output reviewable (`rule.require.snapshots`), and it costs
one test file.

## rework: clean

the test is one file with no callers. to drop it is a delete; to change what it snapshots is an
edit to one classifier.

## confidence: 75%, and why it is not higher

- the classifier lives in a `.agent/repo=.this` skill today. the test needs it in `src`, so either
  the skill moves its classifier into `src` and calls it from `dist`, or the two copies drift.
  the move is the execution's call
- the drift check holds only if most cue rows move into the min verbatim. if the rewrite reflows
  many rows, its exception list grows until the check reads as noise
- a snapshot is a reviewer's eye, not a gate. an author can update it in the same pr that cuts the
  row. what it guarantees is that the cut is visible, never that it is refused

## measured at execution — the drift check is dropped, the snapshot and the peer check ship

`rhx census.minpeer` (paved at 5.1) measured the premise of the drift check before any edit:
**1,195 of 1,581 min lines (76%) do not appear verbatim in their `.md`.** a min is a hand
condensation, so its rows are paraphrases, not copies. the second risk above came true before
the rewrite began: the exception list would hold three quarters of every min, which is noise.

so the test ships two checks, not three:

- the cue snapshot per role (the fork B above, unchanged)
- every booted min has its `.md` on disk (cells 14 and 26), in place of the verbatim check

cell 13 (a `.md` cue edited, its min left behind) is then guarded by review alone, as it was
before this pr. a dream carries the drift check's real shape: a min generated from its `.md`'s
marked cue lines, so the two cannot drift by construction.

the classifier is shared, never copied: `src/domain.operations/learn/asBriefLinesByCue.ts` is a
shipped transformer; the test imports it and `rhx census.cues` requires it (run via `tsx`). a copy was tried first and refuted at peer review
(`repo-rules`, i001), since two copies of one regex set drift as surely as a min and its `.md`.

the test is `roleBootClamps.integration.test.ts`. beside the two checks above, it asserts the
budgeted roles are exactly the clamped set, runs the real `roles boot` under each budget, snaps
each budget, `not` list, and booted ref list, reads the booted set from the cli's own output, and
snaps the halt of an over-budget fixture.

## where

`1.vision.yield.md` (the contract, per repo) · `case=6` `[t2]` · inventory cells 10 and 11.
