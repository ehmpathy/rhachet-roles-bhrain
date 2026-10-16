# F261 — the `$targets` guard journey is pinned at integration

- raised 2026-10-12, by `ergo-acceptance-journey-coverage` (blocker.2), at 5.3 i004
- rework: **clean** — one additive blackbox suite, if the council rules B
- status: 🟡 **BEST-GUESSED — disputed; the council rules on the grain**
- confidence: **70%**

## .the fork, stated fairly

a guard lane may name `$targets` in its `run:` line, and the engine writes the since-main scope to
a list file and substitutes its path. that list, its untracked-file clamp, and its three refusal
variants are pinned in `runStoneGuardReviews.integration.test.ts [case32]–[case32d]` and
`setStoneGuardReviewTargets.integration.test.ts`. no `blackbox/` suite drives it.

| option | the claim |
|---|---|
| **A — the integration grain is the journey's grain** | `$targets` is a guard-file token, not a cli surface. the integration cases already drive the real guard runner against a real git repo, write the real list, and assert the refusal text a lane prints |
| **B — add a blackbox suite** | `rule.require.acceptance-journey-coverage` asks for an end-to-end journey with snapshots; an integration clamp proves the operation, not what a guard author meets |

## .taken, and why

**A.** the journey a guard author meets has no entrypoint of its own: it runs inside
`route.stone.set --as arrived`, which spawns the lane through `runStoneGuardReviews`. the
integration cases call that runner with a real temp repo, a real `origin/main`, and a real lane
command, so the substitution, the list contents, and each refusal are asserted on the bytes the
lane receives. a blackbox suite would add one layer (the cli parse of `--as arrived`) that the
peer `driver.route.*` suites already pin, and a real reviewer lane behind it.

## .rework, and why

**clean.** a blackbox case is additive and depends on no shape this branch hardened.

## .confidence, and why it is not higher

the rule reads every user-faced capability as owed an acceptance journey, and a guard author is a
user. this row bets that the token's journey is the runner's journey, which the council may read
differently.

## .where

`src/domain.operations/route/guard/review/runStoneGuardReviews.integration.test.ts` ·
`src/domain.operations/route/guard/review/setStoneGuardReviewTargets.integration.test.ts`

## .verdict

— (awaits the council)
