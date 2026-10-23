# F108 — extant guard op names wait for one sweep

## .the fork

a peer (`arch-opport-decomposition`, 5.1 i001) named nine extant names that break the verb and
args rules, in files this branch touched by import swaps, doc lines, and field additions:

- six `get*` ops with no cardinality: `getExitCodeClass`, `getReviewCounts`,
  `getReviewCountsViaRegex`, `getReviewCountsViaBrain`, `getStoneGuardJudgeVerdicts`,
  `getStoneGuardReviewPeerFeedbackUnabsorbedUnforgiven`
- three positional accessors on `RouteStoneGuard`: `getReviewPeerRunCmd(review)`,
  `getGuardPeerReviews(guard)`, `getGuardSelfReviews(guard)`

the options:

- (a) rename all nine in this branch
- (b) defer to one sweep, caught as a dream with the exact map

## .taken — (b), and why at the time

- every name is on main, byte for byte. the branch moved none of them
- the sweep reaches about 90 sites: ~40 for the six ops (two test filenames carry the name, as
  does a published brief), 51 for the accessors, and historic review transcripts under
  `__test_assets__/` that a bulk rewrite must not touch. that ripples into files and contracts
  this wish never opened — it fails CLEAN
- the `getReviewCounts*` cascade is already slated to move out of `route/guard/review/` (F97's
  dream); a rename now would land twice
- `getExitCodeClass` is a pure transformer, so its right name is `asExitCodeClass`, not the
  `getOne*` the peer proposed. the sweep is where that choice is made with care
- the harm test names no shipped harm: the names mislead a reader about cardinality, which is
  `better`

## .rework — clean

a mechanical rename, file moves with names, done in one later change. no behavior moves.

## .confidence — 80%

the residual risk is that the council wants the six op names fixed in this PR. that is a
clean add on top of this branch.

## .where

the files named above · the dream `.dream/v2026_10_06.fix.guard-op-names-take-their-cardinality.md`

## .verdict

— (awaits the council)
