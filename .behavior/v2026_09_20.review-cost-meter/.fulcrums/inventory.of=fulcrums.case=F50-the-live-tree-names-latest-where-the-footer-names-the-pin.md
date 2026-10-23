# fulcrum F50 — the live tree names `latest` where the footer names the pin

- rework = 🔴 **dirty** — the tallied slug would thread from the persisted footer through
  `RouteStoneGuardReviewArtifact` and every tree state that carries `tallier` (~8 files, two cache
  readers, and their snapshots)
- status = 🟡 **BEST-GUESSED 2026-09-26 — option A: pin the footer now, defer the tree label**
- confidence = 🟡 **78%**
- raised.by = self, when the `latest` default moved three tree snapshots

## .the fork

`FIXED_FALLBACK_BRAIN` is `fireworks/deepseek/flash/latest` (`F42`, S21). two surfaces render
`tallied by reviewer@<brain>`, and both exist to say WHICH model tallied a count:

| surface | kind | today |
|---|---|---|
| the artifact footer (`runStoneGuardReviews`) | durable — a cache re-read recovers it | ✅ names the **pin** (`flash/v4.1`). clamped in `runStoneGuardReviews.integration.test.ts [case28]`, proven red on a revert |
| the guard tree branch (`formatGuardReviewerTree`) | live — re-rendered each emit, cached artifacts included | 🟡 names **`latest`** |

### A — pin the footer, leave the tree on the constant (taken)

the footer is the record; it can await the pin. the tree formatter is sync and the brains package is
a peer dependency, so it cannot pin without a static import or a threaded field.

### B — thread the tallied slug from the footer to the tree

the honest end state: the tree reads what the footer wrote. it touches the domain object, both cache
readers (`getAllStoneGuardArtifactsByHash`, `getLatestReviewArtifactForSlug`), and every state type
that carries `tallier`.

### C — static import of `PINNED_BY_LATEST_SLUG` in the formatter

one line, and it hard-binds a peer dependency into a module that loads on every route op
(`rule.require.isolated-cli-subpath-exports`). refused.

## 🟡 .why 78%

- the tree label is true at the moment it renders for a fresh round; it goes false only for a cached
  artifact read after the pin moves — a narrow window, and the footer beside it holds the truth
- one surface in two dialects is the smell `define.bhrain-repo-mascot` names for glyphs; a reader who
  sees `latest` in the tree and `v4.1` in the file may read two brains

## .the trigger

a diff that opens `RouteStoneGuardReviewArtifact` or either cache reader. a boundary, never a clock.

## .where

- `src/domain.operations/route/guard/tree/formatGuardReviewerTree.ts:340`
- `src/domain.operations/route/guard/review/runStoneGuardReviews.ts` — the pinned footer
- dream: `.dream/v2026_09_26.fix.guard-tree-names-the-tallied-pin-not-latest.md`
