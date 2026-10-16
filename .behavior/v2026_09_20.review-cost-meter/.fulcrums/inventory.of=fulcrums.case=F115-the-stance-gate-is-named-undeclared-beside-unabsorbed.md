# F115 — the concern-grain gate is named `undeclared` while its prompt says `unabsorbed`

- raised 2026-10-06, by the driver, on a wisher question about what `undeclared` means
- rework: **dirty** — persisted blocker kinds in every route's `passage.jsonl`
- status: 🟡 **OPEN — awaits the wisher**
- confidence: **70%** that a rename is owed; **55%** on the names below

## .the fork, stated fairly

two entrance gates share one verb at two grains, per `rule.always.absorb-every-concern`: absorb
the feedback (a `.taken`, per reviewer) and absorb a concern (a disposition, per concern).

| blocker | grain | its prompt |
|---|---|---|
| `review.peer.unabsorbed` | reviewer — `.taken` absent | "awaits feedbackAbsorption" |
| `review.peer.undeclared` | concern — disposition absent | "awaits absorption: N concerns unabsorbed" |

the second gate's own prompt names its state with the first gate's word. a reader cannot tell
the two apart by name — friction, per `rule.forbid.workarounds`.

| option | the claim |
|---|---|
| **A — keep both names** | no migration; the prompt text is the only drift, fixable alone |
| **B — `review.peer.unabsorbed.feedback` + `review.peer.unabsorbed.concern`** | the glossary's verb at both grains; old rows read as legacy aliases, as `review.peer.exhausted` already is |

## .taken, and why

none yet — held for the wisher. it is dirty: every route's `passage.jsonl`, the drive message,
the status line, the disposition, and their tests all key on the strings.

## .rework, and why

**dirty.** a rename of persisted values needs a legacy reader for every extant row.

## .confidence, and why it is not higher

the names in B are coined here; `rule.require.enumerate-before-you-name` has not been walked
over every blocker kind.

## .where

`src/domain.objects/Driver/RouteStoneGuardBlockerReport.ts` · `setStoneAsPassed.ts` (both gates)

## .verdict

— (awaits the council)
