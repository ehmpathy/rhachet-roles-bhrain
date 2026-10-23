# F22 — `DEFAULT_TEST_BRAIN` stays on fireworks at 5.3; the move is dreamed

## .the fork

`src/.test/genTestBrainContext.ts` pins `DEFAULT_TEST_BRAIN = 'fireworks/deepseek/v4-flash'`, so
every real-brain integration suite built on it fails on the 412 suspension (84 of 87 failures in
`getReviewCounts` and `getReviewCountsViaBrain.caseBrain` were that cause). two choices:

- **A — move it to openrouter now**, and add openrouter atoms to the test brain builder
- **B — catch a dream**, and leave the pin for its own change

## .taken — B, and why at the time

it is safe, but not clean: it swaps the brain under every real-brain suite in the repo, whose
count pins were tuned on the fireworks model, so the ripple runs far past this diff. the suites
fail loud on the 412, never silent.

## .rework — clean

one constant plus one atoms line; the cost is the re-tune of pins it may uncover.

## .confidence — 75%, and why it is low

a sweep of the real-brain suites could show the move is clean after all.

## .where

- `src/.test/genTestBrainContext.ts`
- the four suites that pinned `fireworks/deepseek/v4-flash` literally (`stepReflect.casePriorRules.deepseek-v4-flash`, `stepReview.caseBrain.deepseek-v4-flash.case1..3`)

## .verdict

ruled — A, by the efficiency director at 5.3: fold it in now. a test brain pinned to a suspended
provider fails every real-brain suite whatever this pr does, so the pr cannot go green with the
move deferred; the swap is the same clean, test-pinned move as F21. the dream is struck.

## .shrunk — main already carries the move; naught of it is left on this branch

the merge of `origin/main` brought the same cutover, landed upstream and further along:
`DEFAULT_TEST_BRAIN` is an openrouter deepseek flash slug with host filters, and the four
fireworks-pinned suites are renamed or deleted. every file this fulcrum touched resolved to
main's version, so the branch now carries no F22 change at all.
