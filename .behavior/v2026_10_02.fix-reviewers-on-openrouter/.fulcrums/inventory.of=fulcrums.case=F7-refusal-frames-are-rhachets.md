# F7 — the refusal frames the new snapshots pin are rhachet's, and stay as the caller sees them

## .the fork
- A: snap each refusal as the caller reads it, and leave the frame to its owner
- B: strip the raw metadata block and the empty `ConstraintError:` message in the test helper, so the
  snapshot shows one clean treestruct

## .taken
A. both refusals render in rhachet, not here: the keyrack refusal and the `BrainChoiceNotFoundError`
refusal each print a metadata block after the treestruct, and the keyrack one opens with
`✋ ConstraintError: ` and no message. a helper that strips them makes the snapshot show a frame no
caller ever reads, so a drift in the real frame would pass unseen. the snapshot is a contract of what a
caller sees today.

## .what the reviewers are right about
the frames are untidy: the JSON repeats what the tree says, the brain list is ordered differently in the
two halves, and the header carries no message. the repair is rhachet's to make, and when it lands the
snapshots re-record and the diff shows the flip.

## .rework
clean — a re-record of three snapshots when rhachet changes its frame.

## .confidence
80%. the residual doubt is that this repo could pass the keyrack refusal through its own frame, which
would own the layout here; that is a wider change than the brain cutover.

## .where
`blackbox/__snapshots__/review.key-absent.acceptance.test.ts.snap` ·
`blackbox/__snapshots__/review.brain-stale.acceptance.test.ts.snap` ·
`blackbox/__snapshots__/review.by.key-absent.acceptance.test.ts.snap`

## .raised
i001 r006 graded the metadata block and the empty message as blockers and the inconsistent shape as a
nitpick (`rule.forbid.snapshot-visual-blemishes`).

## .verdict
open — handed to the wisher
