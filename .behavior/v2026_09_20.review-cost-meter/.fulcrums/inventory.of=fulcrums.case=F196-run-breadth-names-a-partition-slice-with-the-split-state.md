# F196 — `--of run` names a partition slice with the split state

- raised 2026-10-09, from i033 r028 nitpick.1 `[nitpick][better]`: on a tree whose latest run is one
  partition of a split, `--of run` prices that slice (or the whole attempt's `$0 refused`) and does
  not say it is one of N
- rework: clean
- status: 🟡 **BEST-GUESSED — disputed; overrule it to ship the slice line now**
- confidence: **70%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — a slice line now** | `├─ partition: <slug> — one slice of a split round; --of tree sums the round`, plus a split corpus at `--of run` and `--of tree` |
| **B — with F93's `split` state** | the run breadth and the tree breadth learn the split together, from one state, so the two cannot drift |

## .taken, and why

**B.** F93 already defers the tree-breadth half until a `split` grade exists. to ship the run half
alone reads the partition tag one way at `--of run` and leaves `--of tree` with its extra `refused`
row — two renders of one fact from two predicates. no money leaks: the reviewer grades it the
instrument's clarity, `better`.

## .rework, and why

**clean.** the partition tag is already in each partition run's args; the slice line is one row in
`genReviewRunStdout`, and the split corpus is one fixture with three log dirs.

## .confidence, and why it is not higher

`--of run` is the breadth a driver types right after a review, so the misread lands at the moment
of most attention. if F93 stays open long, A alone is worth it.

## .where

`src/contract/cli/review._.cost.ts` · `src/domain.operations/review/meter/genReviewRunStdout.ts` ·
`genReviewRunOfPartition.ts` · F93

## .verdict

(open)
