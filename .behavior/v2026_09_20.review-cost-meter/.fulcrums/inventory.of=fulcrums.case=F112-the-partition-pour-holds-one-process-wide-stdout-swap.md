# F112 — the partition pour holds one process-wide stdout swap, never a threaded writer

- raised 2026-10-06, by `arch-hazards-behavior-review-ops` (nitpick.1), at 5.1 i002
- rework: **dirty** — a threaded writer reaches every stdout render inside `stepReview`
- status: 🟡 **BEST-GUESSED — keep the swap; dispute the nitpick**
- confidence: **75%**

## .the fork, stated fairly

a split review must print ONE blockers/nitpicks pair on stdout — the merged one — so each
partition run's own tally must go elsewhere.

| option | the claim |
|---|---|
| **A — one process-wide swap** | `withStdoutToStderr` reroutes `console.log` and `process.stdout.write` to stderr while the pour runs, under one enforced owner, restored in `finally` |
| **B — an explicit writer** | each partition run takes a writer; no global moves, so no unrelated stdout writer is captured |

## .taken, and why

**A.** `rhx review` is a one-command process: while the pour runs, every stdout writer in the
process IS a partition run, so "an unrelated writer captured" names no writer that exists. and
the capture is to stderr, never to /dev/null — a human still sees every line. B threads a writer
param through `stepReview` and every render it calls (`genReviewHeaderStdout`,
`genReviewInputStdout`, the overflow refusal, the warmer emitters), a contract change across
code this stone did not open, to guard against a writer the process does not have.

## .rework, and why

**dirty.** B touches the signature of `stepReview` and its renderers, and every test that spies
on `console.log` to read them.

## .confidence, and why it is not higher

a later host that runs `stepReview` inside a long-lived process (a server, a test harness with
its own stdout writers) would make the capture real. the one-owner guard fails loud on a nested
claim, but not on a foreign writer.

## .where

`src/domain.operations/review/partition/withStdoutToStderr.ts`

## .verdict

— (awaits the council)
