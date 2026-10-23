# F107 — the review.by serial loop is deferred for its render

## .the fork

`stepReviewBy` runs each rubric of a role in a serial `for … of await`. its rubrics are
independent: no rubric reads another's output. `rule.forbid.serial-reviews-that-could-pour`
grades that shape a blocker, and a peer (`repo-rules`, 5.1 i001) raised it.

- (a) pour the rubrics in this branch: a bounded `Promise.allSettled`, plus a live render
  that holds many inflight rows at once
- (b) defer the pour to its own change; catch a dream with the shape of the fix
- (c) keep the loop serial for good, with the shared state named in its header

## .taken — (b), and why at the time

- the loop predates this branch. the branch touched `stepReviewBy.ts` by one import path,
  moved when `genReviewBrainSupply` moved to `brain/`
- the shared state that forces one rubric at a time is real and named:
  `genReviewByRubricStreamer` holds ONE active row (one spinner interval, one `\r`
  overwrite width, one active slug). a pour behind it would interleave start and done
  events across rows and corrupt the live render
- so the cure is a multi-row streamer, which is a change to the review.by cli's live
  contract and its tests. that ripples past the cost-meter wish, so it fails CLEAN
  (`rule.always.fix-forward-under-scouts-honor`)
- (c) is refused: the rule says the shared global is the defect, and a cap of one is a
  blocker

## .rework — clean

the pour lands in one later change: a multi-row streamer (the guard's concurrent peer render
is the model) and a bounded settle in `stepReviewBy`. no caller of this branch leans on the
serial order.

## .confidence — 80%

the residual risk is that the council wants the pour inside this PR. that is a clean add on
top of this branch, never a teardown.

## .where

`src/domain.operations/review.by/stepReviewBy.ts` ·
`src/domain.operations/review.by/genReviewByRubricStreamer.ts` · the dream
`.dream/v2026_10_06.fix.review-by-rubrics-pour.md`

## .verdict

**overturned at 5.1 i002 — the pour landed in this PR.** `repo-rules` re-raised it as a blocker:
a non-reentrant streamer is the exact ground `rule.forbid.serial-reviews-that-could-pour` names,
and its cure is one operation plus tests — not the dirty bar a deferral needs. `stepReviewBy`
now pours under `BOUND_OF_CONCURRENT_RUBRICS`, and `genReviewByRubricStreamer` rides the
guard's own `genReviewWaveBuffer` and `asReviewWaveStatusLine`, so its rows release whole in
declared order. the dream is retired.
