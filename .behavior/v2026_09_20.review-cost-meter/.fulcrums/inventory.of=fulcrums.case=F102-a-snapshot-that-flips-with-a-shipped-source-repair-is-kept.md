# F102 — a snapshot that flips with a shipped source repair is kept

## .the fork

`mech-test-intent` @ 5.3.verification i002, nitpick.2: the guard-summary snapshots for the
malfunction and constraint cases in `blackbox/` now read `approved`, where they once read
`malfunctioned 💥` / a constraint. the reviewer reads the flip as a test tuned to green.

- (a) concede it — revert the snapshots to their old verdicts
- (b) dispute it — the flip encodes a source repair that ships in this changeset
- (c) halt for a human

## .taken — (b), and why at the time

the source change is new on this branch: `getOneCacheSafePeerReviewArtifact.ts`, read by the guard
at `runStoneGuardReviews.ts:489` and `:731` and by `getAllReviewPeerMeterStatuses.ts:118`, with its
own unit suite. the snapshot states what the shipped code produces, and the full acceptance gate
ran green on it. a revert would pin a verdict the code no longer renders, so the suite would go red
on correct behavior.

## .rework — clean

a revert is a resnap of one suite; no prod file moves either way.

## .confidence — 88%

the source repair is real and tested. the residual is that a snapshot case name still describes
the old verdict; a rename would settle that, and costs one line.

## .where

`blackbox/review.by.guard-peer.acceptance.test.ts` and its snapshot ·
`src/domain.operations/route/guard/getOneCacheSafePeerReviewArtifact.ts`

## .verdict

— (awaits the council)
