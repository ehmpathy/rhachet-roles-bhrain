# seed S32 — a new file is an addition, and the three-way diff split reports everywhere

archived verbatim, before distillation (`rule.always.archive-the-wishers-words-verbatim`). typos
repaired; word choice and order kept. one thought, sent as a run of short messages.

## .the utterance

after the driver reported that `review/` sent 387 bodies against 20 diffs:

> wouldnt new files only exist in targetDiffs?

> or are those targetFiles ?

> ok, so, new files should go into diffs. they're a netnew diff. we can just label the whole thing
> as an add; that way its clear it was a diff in this branch. then, we should also report on the
> breakdown of targetDiffs.additions vs mutations

> vs deletions

> right, and the stats need to report that

> we should be able to get that breakdown on demand from the cost skills as well as from the review
> skill on fail or success

> and then show me that report

## .settled

- 🔴 **a new file is a diff of this branch, never surround context.** its whole body IS the change,
  so it renders in the diff group as one block labelled an addition, `<target.diff change="added">`,
  and no longer as a `<target.file>`. `targetFiles` now holds edited-file bodies alone
- `targetDiffs` splits into three named inputs, each with its own lever:

  | input | holds | the lever that shrinks it |
  |---|---|---|
  | `targetDiffs.additions` | the bodies of added files | a partition (S33). no radius reaches an addition |
  | `targetDiffs.deletions` | a path apiece, no body | none needed |
  | `targetDiffs.mutations` | the hunks of edited files | small already, and per round |

- the split is a stat, so every surface that sizes a prompt renders it: **on demand** via
  `rhx review._.cost`, **on fail** in the overflow refusal, **on success** in the review's report
- this supersedes S1's file-tag shape for a new file; S1's core (a new file's body is sent once,
  never as `+`-prefixed lines) still holds

## .landed in

- `asTargetSection.ts`, `isTargetDiffSent.ts`, `isTargetFileSent.ts`, `compileReviewPrompt.ts`
- `getOnePromptComposition.ts`, `asPromptSectionChars.ts`, `asPromptSectionRows.ts`
- `asReviewOverflowScopeLines.ts`, `genReviewRunStdout.ts`, `getOneTargetSplitOfRun.ts`
- (open: confirm the success path of `rhx review` renders the split)
