# F95 — single-use named transformers outrank wet-over-dry

- raised 2026-10-05, by `arch-opport-decomposition` (nitpick.2), at i001.f32cc
- rework: **clean** — two file-local names, inlined or kept, in one file each
- status: 🟡 **BEST-GUESSED — keep the names**
- confidence: **85%**

## .the fork, stated fairly

`asBrainProviderFromChoice` and `asLatestSlugHint` each name one act of the one orchestrator
`getOneBrainChoicePinned`, and each has one usage.

| option | the claim |
|---|---|
| **A — keep the names** | `rule.forbid.inline-decode-friction` grades an inline `slug.split('.')[0]` in an orchestrator a blocker; its own example row is this exact shape |
| **B — inline them** | `rule.prefer.wet-over-dry` says wait for 3+ usages before an abstraction |

## .taken, and why

**A.** the two rules govern different things. wet-over-dry governs GENERALIZATION — one shared
operation over similar code — and neither name generalizes aught; each names one decode step in
place. a named transformer at one usage is what decode-friction asks for. and the grades differ:
to inline would reopen a blocker to close a nitpick.

## .rework, and why

clean. both names are file-local, so either option is a one-file edit with no caller ripple.

## .confidence, and why it is not higher

85%: the two rules read as a direct conflict to a reviewer, and a council may prefer a stated
precedence line in one of the two briefs over a per-case verdict.

## .where

- `src/domain.operations/brain/getOneBrainChoicePinned.ts`

## .the verdict, once ruled

> _unruled._
