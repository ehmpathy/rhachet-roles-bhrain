# F270 — a unit snapshot of an error message pins its contract, not a render

- raised 2026-10-12, by `ergo-snapshot-visual-blemishes` (blocker.8, nitpick.4, nitpick.14), at 5.3 i004
- rework: **clean** — swap `.message` for a rendered refusal in three unit tests, and re-snap
- status: 🟡 **BEST-GUESSED — disputed; the council rules on the grain**
- confidence: **80%**

## .the fork, stated fairly

three unit snapshots pin a thrown error's `.message`, metadata json and all:
`asAbsorption*` and `asRouteGuardReviewPeerPathHash` (route-guard-review), `getOneRouteGuardPartitionsCheck`
(partition), and `asGuardCmdFreeOfNpx` (route-guard).

| option | the claim |
|---|---|
| **A — keep the bag in the unit snaps** | `.message` is the error's structured contract. the bag is data a caller can read, and a unit test of the throw pins that data. no human reads this string raw: every render seam a human meets drops the bag |
| **B — strip the bag in the unit snaps** | the snap is a contract a reviewer diffs, and the json reads as debug noise there |

## .taken, and why

**A.** the bag is dropped at each seam where a human reads it, by one shared parser
(`src/contract/cli/asHelpfulMessageParts.ts`):

- `asConstraintErrorHeader` — every `rhx route.*` refusal, and `rhx review` / `review.by`
- `asTreeCauseLines` — every cause row under a refusal tree
- `genReviewBrainOrRefuse` in `review.ts` — the `--brain` pin refusal

so the claim the lane makes about a human frame is repaired where the frame is built. a unit test
of the throw that strips the bag would test a string no caller receives, and would hide a field
the throw does carry.

## .rework, and why

**clean.** the three tests could render through `asConstraintErrorHeader` and re-snap. no caller
changes.

## .confidence, and why it is not higher

the reviewer grades every `.snap` as a reader's surface. if the council holds that a unit snap is
read as the human surface too, option B is a one-line change per test.

## .where

`src/domain.operations/route/guard/review/peer/__snapshots__/` ·
`src/domain.operations/route/guard/partition/__snapshots__/getOneRouteGuardPartitionsCheck.test.ts.snap` ·
`src/domain.operations/route/guard/__snapshots__/` (`asGuardCmdFreeOfNpx`)

## .verdict

— (awaits the council)
