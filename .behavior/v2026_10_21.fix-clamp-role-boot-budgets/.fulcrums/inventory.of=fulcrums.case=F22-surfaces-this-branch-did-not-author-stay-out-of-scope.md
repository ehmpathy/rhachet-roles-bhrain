# F22 — surfaces this branch did not author stay out of its scope

## .the fork

the 5.3 peer round raised blockers on two kinds of surface this branch touched without author:

| surface | what this branch did to it | the concern |
|---|---|---|
| `review.key-absent`, `review.by.key-absent` snaps (r006 b3, b5) | one token: rhachet 1.50.1's `--vault <vault>` hint | the refusal opens with an empty message, a raw json `attempts:` row, an orphan branch |
| the over-budget halt in `roleBootClamps` `[case4]` (r006 b4) | snaps it as `rhachet roles boot` emits it | the halt prints its tree, then the same error again, a json bag, and an `[args]` row |
| `stepReview.caseBrain.claude-sonnet` (r002 b3) | lifted a skip, one docblock | the suite grades with partial matchers and owes a masked snapshot |
| `route.foreground.guard` layer (b) (r003 b1) | one glyph in a docblock | the harness half is a hand-run, never a test |

either repair each surface here, or leave each to its owner.

## .taken, and why

left to the owner. each render above is emitted by rhachet (`roles boot`, the keyrack
refusal), not by this repo, and a snap that pinned a cleaner render than the tool emits would
lie. the two suites were on main as they are; this branch changed no assertion in either.

🟡 **two rows have moved since this was first written:**

- the `[case4]` row: that snap is a NEW oracle this branch wrote, so its shape was this branch's
  call. it now pins the tree a human reads, and cuts rhachet's machine tail before the snap. the
  row is repaired, no longer left to the owner
- the `stepReview` row: a first answer claimed the default-brain suite snaps `review.formatted`.
  it does not. and on main the premium suite was skipped, so it gated naught; this branch made it
  a gate, which makes its oracle this branch's. it now pins a masked skeleton of the dirty review
  and the masked `metrics` key tree, as inline snapshots so each retry attempt meets one key, held
  across two live runs. the default-brain suite's same gap is extant on main and stays caught as
  `.dream/v2026_10_23.fix.stepreview-formatted-has-no-masked-snapshot.md`

## .rework — clean

each is its own change in its own home: a reseed to rhachet for the two renders, and a new
assertion in each extant suite. none ripples into the boot budgets.

## .confidence — 75%, and why it is not higher

the renders are blemished, and a snap that pins them blesses them. a council may want the
reseeds dispatched before this pr merges.

## .where

`blackbox/__snapshots__/review.key-absent.acceptance.test.ts.snap` ·
`blackbox/__snapshots__/review.by.key-absent.acceptance.test.ts.snap` ·
`src/domain.roles/__snapshots__/roleBootClamps.integration.test.ts.snap` ·
`src/domain.operations/review/stepReview.caseBrain.claude-sonnet.integration.test.ts` ·
`src/domain.roles/driver/skills/route.foreground.guard.integration.test.ts`

## .verdict

ruled 2026-10-23, by the director: overruled for a red test. a red in the local full suite is
fixed in this pr whether or not this diff caused it, each with a clamp red before and green after.
four such reds landed here — the drive-state lock's queue deadline, the partition and prime-meet
bounds, and the drive suite's host-serial leak. the rest of the call stands for surfaces that are
not red.
