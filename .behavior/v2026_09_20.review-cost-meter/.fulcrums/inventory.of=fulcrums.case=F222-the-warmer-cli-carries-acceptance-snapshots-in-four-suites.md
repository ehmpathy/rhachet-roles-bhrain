# F222 — the warmer cli carries acceptance snapshots in four suites

## .the fork

a lane read the 5.3 yield's gate tables, found no row that names a `reviewWarmer*` acceptance
suite, and concluded the warmer's cli surfaces (`--warmer` grammar and refusals, `warmer: none`,
the `review._.warmer` entrypoint and its refusals, the `warmers awake` block) carry no contract-grain
snapshot. two answers:

- **(a)** add a yield row per acceptance suite, so a reader of the yield alone can see them
- **(b)** hold: the coverage is in the tree; the yield's gate rows report one figure per test kind,
  never a per-suite census

## .taken

**(b)**, with the citations below. the concern grades the yield's table shape, not the coverage. the
suites run inside the acceptance row's 144:

| surface | suite | snapshot |
|---|---|---|
| `--warmer off\|on\|<k>x,<m>m` grammar, malformed and over-bound refusals | `src/contract/cli/reviewWarmerFlag.acceptance.test.ts` cases 1–9 | yes, each case |
| the disown block | `src/domain.operations/review/warmer/emitReviewWarmerDisowned.integration.test.ts` · `setReviewWarmerOfRound.integration.test.ts` | integration grain, not acceptance |
| `🦉 warmer: awake` / `already awake` | `src/domain.operations/review/warmer/emitReviewWarmerSpawn.test.ts` | unit grain, not acceptance |
| `review._.warmer` — every refusal its spawn can emit | `src/contract/cli/reviewWarmerSpawnRefusal.acceptance.test.ts` cases 1–8, via the published subpath `rhachet-roles-bhrain/cli/review._.warmer` | yes, each case |
| `warmer: none` on a guardless run | `src/contract/cli/reviewWarmerSilence.acceptance.test.ts` | yes |
| `warmers awake` at tree breadth, with its `kill` line | `src/contract/cli/reviewCost.acceptance.test.ts` `[case24]` (~L4118–4216) | yes, `the warn renders whole` |

`reviewWarmerSpawnRefusal` reaches `review._.warmer` through the published subpath, so it is the
published entrypoint `F19` names, never the module spawn.

## .rework

**clean.** a per-suite census row in the yield is one table, no code.

## .confidence

🟢 **95%** — every surface was checked against a file and a case, on 2026-10-10.

## .where

`src/contract/cli/reviewWarmer*.acceptance.test.ts` · `src/contract/cli/reviewCost.acceptance.test.ts`

## .verdict

unruled — awaits the council.
