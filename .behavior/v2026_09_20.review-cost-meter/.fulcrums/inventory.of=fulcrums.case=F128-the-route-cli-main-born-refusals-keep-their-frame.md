# F128 — the route CLI's main-born refusals keep their frame until a dedicated sweep

- raised 2026-10-07, by the driver, at 5.1 i012: `ergo-friction-hazards` nitpick.1 found three
  refusal frames in `src/contract/cli/route.ts`
- rework: **dirty** — a dozen refusals in commands this wish never touched, and every acceptance
  snapshot that pins one
- status: 🟡 **BEST-GUESSED — dispute it**
- confidence: **85%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — sweep all of route.ts now** | one file, one frame; the reviewer saw the drift, and it is cheapest while the context is warm |
| **B — frame the two commands this diff touched; dream the rest (taken)** | `routeGuardBudget` and `routeGuardPartition` now share `emitReviewRefusal`; the main-born `error:` catches and `routeStoneSet`'s unframed header move in one dedicated sweep |
| **C — declare the bare `error:` form as the route-cli convention** | cheapest, but it blesses a frame that names no error class (`rule.require.qualified-error-headers`) |

## .taken, and why

**B.** the review's first fix — render `routeGuardBudget` the way `routeGuardPartition` already does —
is done. the rest is the second half of the same class, and it reaches commands on main and the
snapshots of many suites, which is a separate change with its own resnap sweep.

## .rework, and why

**dirty.** ~14 sites in route.ts plus `routeStoneSet`'s catch. route.stone.set refusals alone are
pinned across many acceptance suites.

## .confidence, and why it is not higher

- A has weight: `rule.always.fix-forward-under-scouts-honor` asks for the fix while the file is open
- but A fails CLEAN: the ripple is the snapshot corpus, not this diff

## .where

`.dream/v2026_10_07.fix.route-cli-refusals-share-one-frame.md` · `src/contract/cli/route.ts`

## .verdict

— (awaits the council)
