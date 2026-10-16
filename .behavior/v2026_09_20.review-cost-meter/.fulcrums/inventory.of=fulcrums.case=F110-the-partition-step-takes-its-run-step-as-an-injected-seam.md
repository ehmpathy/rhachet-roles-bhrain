# F110 — the partition step takes its run step as an injected seam

## .the fork

`stepReviewByPartitions` takes `context.runOne`, and its one production caller passes
`stepReview` itself. a peer (`repo-rules-review-ops` nitpick.2, 5.1 i001.adc3fab) graded this an
over-injection of a same-repo op (`rule.forbid.inject-same-repo-domain-ops`).

- (a) keep the seam: `runOne` injected, its one production value `stepReview`
- (b) import `stepReview` directly into `stepReviewByPartitions` — a runtime import cycle
  (`stepReview` → `stepReviewByPartitions` → `stepReview`) that resolves because the import is
  read lazily inside the function body — and move the integration test's fake down to the
  brain boundary
- (c) split `stepReview` into a dispatcher and a one-run step, so the partition step imports the
  one-run step with no cycle

## .taken — (a), and why at the time

- the seam carries the whole of `stepReviewByPartitions.integration.test.ts`: three cases pass
  `asRunOneFake`, which records each partition's targets and returns canned verdicts, so the
  split, the bounded pour, the prime, and the merge are graded with no brain and no compile
- (b) moves that fake to a `ContextBrain` that answers canned review output, which also drags
  in real rules, real targets, and a real compile per partition — a rewrite of the suite, to
  grade the same four behaviors through a wider path. it also leaves a runtime import cycle in
  place, legal but one more fact a reader must hold
- (c) cuts a 986-line orchestrator in two in the last stone of the branch; its own fork (where
  the split, prime, and overflow read sit) is larger than the defect
- the defect named is a nitpick by the rule's own enforcement ("avoid"), with no shipped harm

## .rework — clean

one production call site and one test file. (b) is a rewrite of three test cases plus one
import; (c) is a file split with no caller outside `review/`. neither hardens a caller.

## .confidence — 65%

the rule is plain that a same-repo op is imported, and a test seam is not one of its listed
exceptions. a council may prefer (b) and the wider test, and that is a clean move.

## .where

`src/domain.operations/review/partition/stepReviewByPartitions.ts` (the `runOne` field and its
`.note`) · `src/domain.operations/review/stepReview.ts:701` (`runOne: stepReview`) ·
`src/domain.operations/review/partition/stepReviewByPartitions.integration.test.ts`
(`asRunOneFake`)

## .verdict

— (awaits the council)
