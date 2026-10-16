# F185 — route.drive shows the latest guard round as a compact tree

- raised 2026-10-07, from a dogfood friction: a guard round's verdict tree prints once, on the
  stdout of the arrival. lose that stdout and no command shows the lanes' verdicts or counts;
  the driver grepped the givens by hand to rebuild the tally
- rework: **clean** — one render option on the shared formatter, one block in `formatRouteDrive`
- status: 🟡 **BEST-GUESSED — a compact density of the one shared reviewer tree, approved-clean
  lanes folded into one count**
- confidence: **80%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — a compact density of the extant reviewer tree** | one line per lane (`r1: arch (l1, 1/3) — rejected, 2 blockers 🔴, 1 nitpick 🟠`) plus a `given:` line for each non-approved lane; approved 0/0 lanes fold into one count; the judge row closes the block |
| **B — the full guard round tree, replayed verbatim** | the exact bytes the arrival printed: buckets, durations, stdout and stderr per lane |
| **C — a new standalone command** (`route.stone.get --round latest`) | the summary lives off the drive surface, where a driver asks for it |
| **D — a one-line tally** (`i004: 2 rejected, 1 malfunction, 18 approved`) | the cheapest read; the driver opens the givens for the rest |

## .taken, and why

**A.**

- the drive is re-read many times per stone (every hook, every boot), so the block must stay small
  at 20+ lanes. the fold of approved-clean lanes keeps it to the lanes that owe the driver aught
- it reuses the one formatter (`formatGuardReviewerTree` with `density: 'compact'`, threaded
  through `formatReviewsMeterLines`), per `rule.forbid.duplicate-format-tree-operations` — so the
  verdict words, glyphs, and count phrases cannot drift from the arrival's tree
- every non-approved lane names its given path, which is the one fact the hand grep recovered
- **not B:** the full tree carries per-lane stdout and durations, which are not on disk in a
  replayable form and would flood every hook. **not C:** a separate command is a second place to
  look; the friction was that the drive, the one surface a driver re-reads, went silent. **not D:**
  a count with no address sends the driver back to the grep

## .rework, and why

**clean.** to remove: drop the `round` input and its one `if` in `formatRouteDrive`. to reshape:
the block is one transformer (`formatRouteDriveRoundLines`) over one read
(`getOneStoneGuardRoundLatest`).

## .confidence, and why it is not higher

- the fold hides approved-clean lanes by slug. a driver who wants to confirm one lane by name must
  open the givens — judged rare, since a clean lane owes no answer
- the round iteration is read as the highest given iteration across the live meters, so a lane
  that last spoke on an older iteration shows its older given beside the newer ones. that matches
  the halts' meter read, which already crosses iterations by slug
- the block shows in every drive render where a round is on disk, onBoot and onStop included; a
  wisher may prefer it on direct mode alone

## .where

`src/domain.operations/route/guard/tree/formatGuardReviewerTree.ts` (`density: 'compact'`) ·
`src/domain.operations/route/guard/tree/formatGuardTree.ts` (`formatReviewsMeterLines`) ·
`src/domain.operations/route/drive/formatRouteDriveRoundLines.ts` ·
`src/domain.operations/route/drive/getOneStoneGuardRoundLatest.ts` ·
`src/domain.operations/route/drive/asStoneGuardRoundIteration.ts` ·
`src/domain.operations/route/guard/judge/getAllStoneGuardJudgeVerdictsOfIteration.ts` ·
`src/domain.operations/route/stepRouteDrive.ts` ·
clamp: `src/domain.operations/route/stepRouteDrive.integration.test.ts` `[case17]` ·
acceptance: `blackbox/driver.route.drive.acceptance.test.ts` `[case10]`

## .verdict

(open)
