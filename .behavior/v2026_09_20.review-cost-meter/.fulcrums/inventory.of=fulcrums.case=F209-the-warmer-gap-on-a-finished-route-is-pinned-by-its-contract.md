# F209 — the warmer gap on a finished route is pinned by its contract, not a route fixture

- raised 2026-10-10, from i035 r028 nitpick.2 `[nitpick][better]`: the wish accepts that a
  guard-driven `--warmer on` round spawns a warmer even on a route that is done, blocked, or out of
  budget, bounded at `k` pokes; no acceptance case shows a round on such a route
- rework: clean
- status: 🟡 **BEST-GUESSED — disputed**
- confidence: **70%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — an acceptance case on a completed route** | the accepted gap and its bound show in a diff |
| **B — the contract already pins both halves** | the gap is structural, and the bound is snapshotted |

## .taken, and why

**B.** `setReviewWarmerOfRound` takes `{ cwd, lane, plan, logDir }` and no route state at all, so a
round on a finished route and a round on a live one are the same call — a fixture of route status
would exercise no branch. to close the gap means a new input on that contract, which every caller
and its type check would show. the `k` bound is pinned twice: the spawn line in
`emitReviewWarmerSpawn` (`bound: 3 pokes, 15m apart per review gap`, snapshotted) and the
over-bound refusal in `reviewWarmerFlag [case3]`. an acceptance case would also spawn a real
detached process and a real brain poke, for no new branch.

## .rework, and why

**clean.** one acceptance case, if the council wants the gap visible as prose.

## .confidence, and why it is not higher

a reader of the acceptance suite alone would not learn the gap exists; the wish states it, the
suite does not.

## .where

`src/domain.operations/review/warmer/setReviewWarmerOfRound.ts` ·
`src/domain.operations/review/warmer/__snapshots__/emitReviewWarmerSpawn.test.ts.snap` ·
`src/contract/cli/reviewWarmerFlag.acceptance.test.ts`

## .verdict

(open)
