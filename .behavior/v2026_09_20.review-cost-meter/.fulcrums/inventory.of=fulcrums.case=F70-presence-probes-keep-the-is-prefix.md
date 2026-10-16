# fulcrum F70 — five presence probes keep the `is*` prefix

- rework = 🟠 **dirty** — five files, their tests, and 80 reference lines across the review and warmer trees
- status = 🟡 **BEST-GUESSED 2026-09-30 — hold**
- confidence = 🟡 **65%**
- raised.by = `arch-opport-decomposition-review-ops` r018 nitpick.3, i030

## .the fork

- **rename** `isPathPresent`, `isRunArtifactPresent`, `isWarmerReplayable`, `isReviewWarmerLockMidWrite`,
  `isReviewWarmerAlive` to a communicator verb (`getOne*`), since each reads the disk or the process table
- **hold** the `is*` prefix

## .taken — hold, and why

- each answers one yes/no question about the world, which is what a reader expects from `is*`
- a `getOne*` rename reads worse at every call site (`if (await getOnePathPresence(...))`) and buys no
  behavior change
- the grain question the reviewer raises is real, and it applies to every presence probe in the repo, not
  only the five this branch touched. a rename across 80 lines is a sweep this wish did not scope

## .confidence, and why it is low

the mechanic rule lists `is*` under pure transformer prefixes, so a strict read sides with the reviewer.
the hold rests on call-site legibility, which is a judgment.

## .verdict

open — for the council.

- 2026-10-07 — re-raised at i017 (`c0dcbd0db9103760c0`) by `r021.arch-opport-decomposition-review-ops`
  nitpick.1, on `isPathPresent`, `isRunArtifactPresent`, and `isWarmerReplayable`. the lane grants
  the hold measures cost and asks whether the name declares the body's grain. one of the three is
  now repaired: `isWarmerReplayable` answered a `{ replayable, pathOfHead }` record, never a
  boolean, so its `is*` was wrong on shape as well as grain. it is renamed `getOneWarmerReplay`
  (one caller, one test), a clean rework. the two left are true yes/no probes, and the hold on
  them stands as stated above. the fork narrows to four probes. still open, for the council.
