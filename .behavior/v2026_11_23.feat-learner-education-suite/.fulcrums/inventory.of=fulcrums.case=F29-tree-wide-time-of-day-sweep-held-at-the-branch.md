# fulcrum F29: a tree-wide time-of-day sweep, held at the branch

## .the fork

the order asks that the tracked files and every commit of this branch hold no time of day in
three shapes (a colon clock, a clock with a digit masked as x, a dash time id), code and fixtures
included, each case to keep its date and drop its time.

- **(a) the branch scope**: every file this branch adds or changes holds none; the extant corpus
  on main is left for its own change
- **(b) the tree scope**: strip all 637 lines in 153 files, most of them extant on main

## .measured

`rhx timestamps.get` (this repo's skill; the named `timestamps.strip` is not in this tree, on
origin/main, or in the org search):

| scope | lines | files |
|---|---|---|
| `--scope staged` (this branch: 351 files) | 0 | 0 |
| `--scope tree` (every file not gitignored) | 637 | 153 |

the 153 tree files: 56 live code and snapshot files under `src/` and `blackbox/`, 12 archived
code files under one route's `archive/`, and the rest prose from prior routes and dreams. none
is changed by this branch.

## .why it is dirty

the review meter names each run's log dir by its mint time to the millisecond (`genLogDirName`),
and reads that name back for order and elapsed time (`asLogDirMintedAt`,
`asRunDirChronologicalOrder`, `isReviewRunDirLater`, `getOneMinutesBetweenRunDirs`). a test of
"which of two runs a millisecond apart is later" or "minutes between two runs" holds a time of day
because the time is its subject. to keep the date and drop the time there either retires those
cases or renames every log dir, a contract change to the review meter outside this wish.

## .taken

(a) at the branch, so far: the branch is clean in all three shapes, and the push is held. (b)
waits on a verdict, since it is a corpus-wide rewrite of another bounded context in an education pr.

- **rework**: dirty — (b) means a review-meter contract change, then ~56 code files and their
  snapshots
- **confidence**: 70%: the order reads tree-wide, and it may target the skeptic promotion tree

## .verdict

settled by the foreman: (a), branch scope, push now; the tree-wide strip is caught as a dream (`.dream/v2026_11_27.fix.strip-times-of-day-across-the-tree.md`).
