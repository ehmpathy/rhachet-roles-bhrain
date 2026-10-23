# domain.term.choice.reason: verdict

## .etymology

`verdict` — a judgment delivered on evidence. it is the word for a call a reader can act on,
reached from records rather than asserted. that is the warmer's figure exactly: it reads the poke
costs and the reviews that followed, and it states what those records support — no more.

## .rejected

| rejected | why |
|---|---|
| `outcome` | names what happened, never what the evidence supports. an `unproven` warmer has an outcome and no verdict |
| `result` | generic english, and `ReviewRunResult` already holds the word in this domain |
| `score` | implies a scale; the set is three discrete claims, not a magnitude |
| `status` | names a lifecycle state. a verdict can move from `unproven` to `loss` with no lifecycle event, only new evidence |

## .why the positions do not earn clusters of their own

`rule.require.domain-term-itemization` counts a word that composes a declared dobj or dop. the
genus does — `WarmerValueVerdict`, `asWarmerValueVerdict`. the positions do not: each is a string
value of that one type, rendered by one formatter, and weighed only against its siblings. so the
census holds them here, as rows of their genus, and a position earns its own cluster the day it
enters a name or is read apart.

the precedent it parts from: `warm` and `cold` each have a cluster because each is read alone,
beside a cache rate, as a property of a bucket — the reader never sees the pair at once.

## .evidence

- raised 2026-10-02 by a peer review of `.behavior/v2026_09_20.review-cost-meter` (i053, r014
  blocker.2): the glyph catalog declared the verdict's glyphs and the glossary held none of its
  positions. the set is three (`unproven` · `loss` · `maybe`); `awaited` is a settle row with
  no glyph, never a position
- the type: `export type WarmerValueVerdict = 'unproven' | 'loss' | 'maybe'` in
  `getOneWarmerValue.ts`; `awaited` is the `WarmerPairSettle` value the renderer shows beside it
