# seed S36 — partitions pour, and partial review progress is never dropped

archived verbatim, before distillation (`rule.always.archive-the-wishers-words-verbatim`). typos
and profanity repaired; word choice and order kept. a correction, sent as a run of short messages,
after the driver reported that partitions run one after another and that a partition fault
discards the verdicts before it.

## .said

> that's [placeholder]; partitions should run in parallel. you should enrule to maximally parallelize always

> and we should never throw away partial results

> that's even [placeholder] dumber

> why would you see this and think that was acceptable?

> enrule to never serialize reviews that could be concurrent, and enrule to never drop partial review progress - that's important information

## .settled

- 🔴 **independent reviews pour, always.** a serial loop over reviews that do not read each other
  is a defect, and a shared global that "forces" the serial loop is what to fix
- 🔴 **a fault in one review never erases the verdicts of the others.** completed verdicts are
  information a driver can act on; a fault adds a concern, never subtracts one
- 🔴 the driver saw both defects in the code, read the header that argued for them, and accepted
  it — **a header that argues for a defect is not a reason to keep it**

## .landed in

- `.agent/repo=.this/role=any/briefs/rule.forbid.serial-reviews-that-could-pour.md`
- `.agent/repo=.this/role=any/briefs/rule.forbid.dropped-partial-review-progress.md`
- `src/domain.operations/review/partition/stepReviewByPartitions.ts`
- `src/domain.operations/review/partition/withStdoutToStderr.ts`
