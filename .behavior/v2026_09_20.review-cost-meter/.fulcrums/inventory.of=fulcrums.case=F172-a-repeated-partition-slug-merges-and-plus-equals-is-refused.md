# F172 — a repeated partition slug merges its globs, and `+=` is refused

- raised 2026-10-07, by the glob-syntax repair (the wisher's snag 3: brace globs were fiddly)
- rework: **clean** — one parser branch (`asReviewPartitionFlagsMerged`) and its refusal text
- status: 🟡 **BEST-GUESSED — merge, refuse `+=`**
- confidence: **85%**

## .the fork, stated fairly

a driver who must widen a partition (pull one more test dir into `route`) needs a way to add a
glob without a rewrite of the whole brace list.

| option | the claim |
|---|---|
| **A — a repeated slug merges** | `--partition 'route=a/**' --partition 'route=b/**'` reads as one partition of two globs. the declaration still names the whole set (S46), so a re-run of `route.guard.partition` with the full flag list is the one edit form |
| **B — an `+=` append form** | `--partition 'route+=b/**'` adds to what the guard already holds. shorter for a one-glob widen |
| **C — refuse a repeated slug** | the strictest; forces the driver back into the brace list snag 3 named |

## .taken, and why

**A**, with `+=` refused and its refusal print the A-form fix. S46 settled that a partition
declaration names the whole set, so an append form would be a second write model beside the one the
tool has; a merge keeps one model and still lets each glob sit on its own flag, which is what made
the brace list fiddly to begin with.

## .rework, and why

**clean.** if the council prefers B, `+=` becomes an append against the guard's current set in
`setRouteGuardPartitions`; no caller outside the partition parser depends on the refusal.

## .confidence, and why it is not higher

B is the shorter keystroke for the commonest widen, and a driver may reasonably prefer it over a
re-run of the full list.

## .where

`src/domain.operations/review/partition/asReviewPartitionFlagsMerged.ts` ·
`asReviewPartitionGlobsOfText.ts` · `src/contract/cli/route.ts`

## .verdict

🔴 **OVERRULED 2026-10-07, toward append (S51), in the form `--claim <path|glob> --into <slug>`
(S53), never `+=`.** the whole-set guarantee belongs to the
STORED declaration, never to the keystrokes that change it: an append reads the stored set, merges
the one glob, and writes the whole set back, so the guarantee holds. the repeated-slug merge stays
too, for a declaration that names every partition in one call.
