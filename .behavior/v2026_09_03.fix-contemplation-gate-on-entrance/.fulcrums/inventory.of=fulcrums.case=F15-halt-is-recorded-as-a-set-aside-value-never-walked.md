# F15 — `halt` is recorded as a set-aside value, never walked as an eighth

| | |
|---|---|
| **rework** | **clean** — one note becomes a 16-cell slab; no consumer hardens against it |
| **status** | **open** |
| **confidence** | 🔴 **88%** that a record beats a walk · **99%** on the fact beneath it |
| **where** | `1.vision.experience.dimensions.md` § A · `1.vision.experience.case=_.md` (the 112-cell product) |

## .the fork, stated fairly

`rule.forbid.unanswered-exits-from-a-blocker` names **four** forbidden exits from a blocker, and
`--as blocked` is one of them. axis A carries seven moves and `halt` is not among them — so a
reader who arrives from that rule looks for the row, finds no row, and finds no note that says why.

**walk it** — add `halt` as an eighth value. the product goes `7 × 4 × 4 = 112` → `8 × 4 × 4 = 128`,
and `rule.require.dimensional-decomposition`'s completeness stays earned **by construction**.

**record it** — leave axis A at seven and write the exclusion, with its reason, where a reader
looks.

## .taken, and why — record it

⇒ **because the slab is void, and a void slab adds no falsifiable claim.**

🔴 **the fact beneath it is measured, not assumed.** a grep of
`src/domain.operations/route/stones` for `Uncontemplated|ContemplationStatus` returns **two files
and no third**:

| operation | consults the gate? |
|---|---|
| `setStoneAsPassed.ts` | ✅ `:333` (entrance, P1) · `:899` (exit) |
| `setStoneAsContemplated.ts` | ✅ `:52` |
| **`setStoneAsBlocked`** | ⛔ **absent from the results** |

so all 16 cells of a `halt` slab would read *permitted, no interaction* — identical to one another,
and identical to `reviewer-runs × exhausted`, the void column the dimensions file already records
rather than walks. **16 rows of one sentence is not coverage; it is bulk a reader must scan to
learn a single fact.**

⚠️ **and the cost is not hypothetical this round.** five of eleven reviewer lanes are dark at ~144%
of a 1M-token window across 310 files. a 16-cell slab enlarges the corpus that darkens them, to
state what one paragraph states better.

## 🔴 .why the confidence is 88% and not higher — the counter-argument is real

`rule.require.dimensional-decomposition` earns completeness **by construction**: you walk the
product, so no cell can hide. **an exclusion by judgment is precisely what that construction was
meant to remove.**

⇒ a purist reads it this way, and the read is not weak: *"you judged a slab void by a look. that is
the same act the walk exists to replace — and you have been wrong about a void before."*

⚠️ **and this page holds evidence for that worry.** the `retired` column was itself added late, and
once it was finally **walked** rather than tallied, four cells that sat `itemized` turned out to be
demonstrated outright (5.3, i020, r5 nitpick.2). ⇒ **a cell nobody walks is a cell whose verdict
nobody checks**, and that is exactly what this call creates — deliberately, and with the reason
written down.

**what would overturn it:** any change that makes `setStoneAsBlocked` consult the contemplation
state. the dimensions note names that trigger explicitly, so the reversal is a re-walk rather than
a re-derivation.

## ⚠️ .what the record must carry, or it is worse than the walk

an exclusion is only safe while its **reason is checkable**. the note therefore carries the grep
that produced it, the two file:line consumers, and the trigger for reversal — so a later reader can
falsify it in one command rather than trust it.

🔴 **the sharpest fact the note preserves is a limitation of the engine, and a void slab would have
buried it anyway:** the gate cannot part a **legitimate** halt (a point answered and unclosable —
`rule.always.raise-a-blocker-a-taken-cannot-close`) from a **forbidden** one (a point never
answered). **only the driver knows which it is.** that is why the forbid rule grades its
`--as blocked` row `⛔ open` rather than `✅ refused`, and it is a fact about the design, not a gap
in the catalog.

⇒ **this drive is itself an instance.** stone 5.3 halts while r10's blocker stands open — answered
in full, and unclosable without a credential. the engine permits that halt and would permit an
unanswered one identically.

## .the cost if it is reversed

one note becomes 16 rows and one paragraph. no test, no snapshot, and no consumer hardens against
the count — the tally lines in `case=_.md` and `1.vision.yield.md` move together, and both already
sit under a standing evolution rule. ⇒ **clean.**
