# F8 — two folds answer one question with two row shapes

- raised 2026-09-22, by the driver, at i010 (surfaced by `enroll-impl-arch-defects`, r011 #2)
- rework: **clean**
- status: OPEN — half fixed this round, half is a render-contract call gated with `F7`
- confidence: **60%**

## 🔴 .why this is a row of its own, when `F7` already holds the argument

`F7`'s body carries this item verbatim, under `.confidence, and why it is not higher`:

> the lane's **structural** point stands on its own: `getAllBucketsByKey` (meter) and `asRollup`
> (grove) each reimplement group→fold→sort with divergent row shapes.

⇒ so the CONTENT is not absent. what is absent is a **name a reader would find it under**.
`F7` is titled *"`tree` ranks on the PROMPT total where `grove` ranks on FULL-RATE tokens"*, and
a traveler who scans the index for *"the two folds duplicate each other"* reads that title and
moves on.

🟡 **that is this inventory's own recorded lesson, applied to itself.** `F5` earned a `4b` because
its entry called depth 4 *"the dir scheme"* while the same choice sat in four dop names no dir
move would reach:

> a fulcrum whose fork is named imprecisely reserves less than a reader believes, which is worse
> than an absent row: an absent row invites a look, and a half-row closes one.

⇒ a sub-point inside a differently-titled fulcrum is a half-row by that test. `F8` is the name;
`F7` keeps the shared-fold mechanics, because the `rankBy` parameter is what option C is for.

## .the fork, stated fairly

both surfaces fold `ReviewRunMeter[]` into *"one keyed bucket: a grade census, tokens, a cost"*.
each was written twice:

| | `--of tree` (`asReviewMeterBucket`) | `--of grove` (`asGradeCensus` + `asRollup`) |
|---|---|---|
| the run counts | `runs: { total, metered, refused, unknown, accounted }` — one object | `runs: number` + a separate `census: { metered, refused, unknown }` |
| `accounted` | ✅ present | 🔴 **absent** — yet `asAccountedCost` is still called on the row |
| per-row `cacheHitRate` | ✅ present in every row | 🔴 **absent** — a rate exists only at the grove TOTAL |
| the tiebreak | none — insertion order | `\|\| a.key.localeCompare(b.key)` |

⇒ three divergences across one concept. the fourth — the rank quantity — is `F7`'s.

| option | the claim |
|---|---|
| **A — leave both** | the two surfaces answer different questions. a grove reader compares TREES and a tree reader compares LANES, so a row shape tuned to each is a feature, not a drift |
| **B — one `RunBucket` type, one `rollupRunsByKey` fold** | one concept, one shape. the divergences above are then impossible by construction rather than by a reviewer who happens to read both files |
| 🔴 **C — B, but the row shape is a render-contract change** | a grove row that gains `accounted` and a `cacheHitRate` gains two columns a wisher never asked for, or gains two fields the renderer drops. **that is the part no refactor can decide** |

## .taken, and why at the time

**split, and only the safe half was taken.**

### ✅ taken this round — the duplicated `accounted` predicate

the one item in the list with no design question under it, and it passed SAFE + CLEAN outright
(`rule.always.fix-forward-under-scouts-honor`), so it was fixed rather than deferred:

- `asAccountedCost` filtered `grade === 'metered' || grade === 'refused'`
- `asReviewMeterBucket` summed `metered.length + refused`

**two expressions of one law**, which agree only while the grade set holds exactly three values.
⇒ extracted to `isRunAccounted`, read by both. the arithmetic form is now refused in a comment
at the site that carried it, so the next author cannot re-derive it by accident.

🟡 **the lane reported THREE surfaces here and there are two.** the third
(`genReviewMeterStdout.ts:34`, `bucket.runs.accounted === 0`) *reads* the derived field rather
than re-encodes the predicate, so it cannot drift. ⇒ the item was right and its count was
not — `rule.require.trust-but-verify`, paid again on a concern that was already conceded.

### ✅ taken at i022 — the duplicated grade FOLD, which is a strict subset of the row

`enroll-impl-arch-defects` found the other half of the same shape and, crucially, **argued it was
separable**: the fold does not wait on `F7`/`F8`'s harder row-shape question, since it is a
strict subset, decomposable on its own.

⇒ and that is right, so it was fixed rather than deferred. `grove/` had already extracted
`asGradeCensus`; `meter/`'s `asReviewMeterBucket` hand-rolled the identical count as three
separate `.filter().length` passes. **the two agreed by coincidence of authorship, never by
construction.**

`asGradeCensus` + `GradeCensus` now sit at `review/`, beside the five operations already lifted
there for this exact reason (`asAccountedCost`, `isRunAccounted`, `asCacheHitRate`,
`asPromptTokens`, `ReviewTokens`), and both breadths call the one fold.

🔴 **and the type was hardened past what the lane asked for.** `GradeCensus` was a hand-listed
triple, so a FOURTH grade would have compiled clean and simply stopped to be counted — every
share it feeds then reads high by exactly the runs it dropped, in silence. it is now a
`Record<ReviewRunGrade, number>`, which is the `KEY_OF_AXIS` / `LABEL_OF_ABSENT_KEY` shape the
same lane praised in its own §3 as *"the right failure mode for exactly the class of defect that
recurred most across this trail"* — applied to the axis the trail actually recurred on.

**proven red**: a fourth grade added to `ReviewRunGrade` produced **3 type errors**, at the fold
and at both literals that build a census.

### 🔴 deferred — the unified row shape

because **option C is real**: `GroveRollupRow` is rendered, and to unify the shape is to decide
what a grove row PRINTS. that is the identical class of call `F7` is open on, one layer up, and
the same council should rule both — which is what the lane itself proposed.

🔴 **and i022 supplied the concrete blocker the row had only described.** the two shapes differ
in a way that is not cosmetic:

| | `--of tree` | `--of grove` |
|---|---|---|
| the grade counts | **FLATTENED** onto the bucket — `runs: {total, metered, refused, unknown, accounted}` | **NESTED** — `runs: number` + `census: GradeCensus` |

⇒ **a shared renderer, or a shared row type, cannot exist until one of those two wins.** that is
the mechanical obstacle to the `rollupRunsByKey({ runs, asKey, rankBy })` parameterization i009
proposed, and it is now stated as such rather than left for the council to re-derive.

🟡 the seam is deliberately left VISIBLE in code: `asReviewMeterBucket` reads the census **field
by field** rather than spreads it, so a reader sees the two shapes meet, and a future unification
has one obvious place to land.

## .rework, and why

**clean.** every surface is unreleased and the blast radius is bounded to `review/meter/`,
`review/grove/`, their two stdout renderers, and the snapshots. no external consumer, no guard,
no rubric, no lane bind.

🟡 **clean is not small.** two report types, two renderers, and every meter + grove snapshot
move together. graded clean on the `F5` precedent — a rename that reached dirs and dop names and
rippled past none of them.

## 🔴 .confidence, and why it is not higher

**60%.** the split is where the honesty sits:

- ✅ **~90% that the duplicated predicate was worth a close** — one law, two expressions, and this
  branch has now paid for that exact shape four times (`asFullRateTokens`, `asAccountedCost`,
  `asPromptTokens`, `isTargetDiffSent`). it is fixed, so this half is no longer a fulcrum
- 🔴 **~45% that one unified row shape is right at all.** option A is not a straw man. the two
  rollups genuinely serve different readers, and a shared type that carries every field both
  want is a union that wears a concept's name — which trades a visible duplication for an
  invisible one

⇒ so the honest grade is *"one half was a defect and is closed; the other half is a design
question the fold's existence does not settle."*

## .where

- `src/domain.operations/review/meter/isRunAccounted.ts` — the predicate, extracted at i010
- 🔴 `src/domain.operations/review/asGradeCensus.ts` — **the one fold, lifted at i022**, and the
  `Record<ReviewRunGrade, number>` that makes a fourth grade fail to typecheck
- `src/domain.operations/review/meter/genReviewMeterReport.ts` — `asReviewMeterBucket`, which now
  CALLS that fold and reads it field by field; the comment there names the seam this row reserves
- `src/domain.operations/review/grove/genReviewGroveReport.ts` — `asRollup`, the grove caller
- `inventory.of=fulcrums.case=F7-tree-ranks-on-prompt-where-grove-ranks-on-full-rate.md` — the
  rank-quantity half, and option C's `rollupRunsByKey({ runs, asKey, rankBy })`

## .the verdict, once ruled

> _unruled._
