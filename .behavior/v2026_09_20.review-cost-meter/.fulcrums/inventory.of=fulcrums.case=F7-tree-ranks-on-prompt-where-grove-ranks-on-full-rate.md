# F7 — `--of tree` ranks on the PROMPT total where `--of grove` ranks on FULL-RATE tokens

- raised 2026-09-22, by the driver, at i008 (surfaced by `enroll-impl-arch-defects`)
- rework: **clean** — a column label, a sort key, and two snapshots
- status: OPEN
- confidence: **55%**

## .the fork, stated fairly

both rollups answer one question — *"which lane is dear, so a driver can aim a cut"* — and they
rank by two different quantities:

| surface | ranks by | renders | coherent with itself? |
|---|---|---|---|
| `--of tree` | `asPromptTokens` = `input + cacheSet + cacheGet` | the **prompt total** | ✅ yes |
| `--of grove` | `asFullRateTokens` = `input + cacheSet` | `at full rate` | ✅ yes |

🔴 **so the fork is NOT "one of the two sorts wrong."** each already obeys
`rule.require.single-source-of-truth-for-render` — each ranks on exactly the column it prints,
and `genReviewMeterStdout.test.ts [case3]` is the clamp that made tree's so, with two lanes that
invert between `input` and `prompt` on purpose.

⇒ the real fork is one layer up: **which QUANTITY should a tree rollup print?**

| option | the claim |
|---|---|
| **A — keep the prompt total** | it is what the tree SENT. a driver who wants volume, cache seams, and a hit rate reads it directly, and the per-bucket `cacheHitRate` column only makes sense beside it |
| **B — print `at full rate`, as grove does** | ranks by what is actually BILLED. cache.get costs 1/31.4, so a cache-heavy lane can outrank a genuinely dear one — *"the whole point of the rollup is to aim a cut"* (`asFullRateTokens`'s own `.why`) |
| 🔴 **C — extract one fold with `rankBy` as a NAMED parameter** | raised at i009 by `enroll-impl-arch-defects`. `rollupRunsByKey({ runs, asKey, rankBy })`, where each caller states `'prompt'` or `'fullRate'` out loud. **it does not pick a side** — it converts a silent divergence into a declared one, which is the actual harm |

### 🔴 .option C dissolves the dependency this file recorded, and the record was wrong

an earlier draft of this fulcrum closed with *"the shared fold cannot be written until this
question is ruled, because its whole value is that the rank quantity is declared once."*

⇒ **that is refuted, and the refutation is the lane's contribution.** the value of a shared fold
is not that the rank is declared *once globally* — it is that it is declared *explicitly at each
call site*. a `rankBy` parameter delivers exactly that, and it is legal for the two callers to
pass different values, because the whole defect is that today they differ **with no declaration
beside them**.

🟡 so option C is **not a third answer to "which quantity?"** — it is the move that makes A-vs-B
a documented choice rather than a drift, and it can ship **before** the council rules. a later
verdict then flips one argument at one call site.

## .taken, and why at the time

**A — no change this round.** the reasons:

- 🔴 **the lane's proposed repair would go RED against `[case3]`** and reintroduce the exact
  sort-vs-display defect a prior round extracted a clamp for. a swap of the sort key alone is
  refused; only a swap of **both** the column and the key is coherent
- the two breadths are **not redundant surfaces**. `--of tree` carries a per-bucket
  `cacheHitRate` in every row, which is a statement about the prompt total and reads as noise
  beside a full-rate figure. `--of grove` carries a cache rate only at the total. ⇒ option B is a
  **render contract change**, not a one-line sort fix
- this branch's declared bound is *"it does not change any rubric, any guard, or any lane's
  bind"* — and a shipped column that a driver reads is the same class of commitment

## .rework, and why

**clean.** option B touches one sort key, one column label, `[case3]`'s two assertions, and the
meter snapshots. no caller, no contract, no other surface.

## 🔴 .confidence, and why it is not higher

**55%.** the lane's argument is good and half of it is right:

- ✅ **the incoherence is real** — two surfaces, one stated purpose, two rankings, and neither
  `--help` nor either render says the divergence is deliberate. that much is conceded outright
- 🔴 **and the lane's DIAGNOSIS is one layer off**, which is why this is a fulcrum rather than a
  fix: it read the difference as an unpropagated repair, where both sites are already internally
  coherent and the difference sits in the rendered quantity

⇒ so the honest grade is *"a real seam, whose repair is larger than the report implies."*

🟡 and the lane's **structural** point stands on its own: `getAllBucketsByKey` (meter) and
`asRollup` (grove) each reimplement group→fold→sort with divergent row shapes
(`ReviewMeterBucket.runs` is an object; `GroveRollupRow` splits `runs: number` from a separate
`census`). **that is `rule.prefer.most-common-denominator` at the scaffold around the bucket**,
where i007 applied it only to the arithmetic inside.

⇒ 🔴 **that point now has its own row — `F8`** — because it lived here under a title about rank
keys, and a reader who scanned the index for the duplication would never have found it. this
file keeps the shared-fold MECHANICS (option C's `rankBy`); `F8` keeps the row-shape question and
records the duplicated `accounted` predicate that was fixed at i010.

⇒ **and it is NOT gated on this verdict** — see option C. the extraction can ship first and the
council rules afterward, which reverses the order an earlier draft recorded.

## 🔴 .why the verdict is time-sensitive — added at i011

a peer supplied the argument this row had not: **the item's COST changed, even though its
substance did not.**

while only one breadth shipped, the divergence was **invisible** — no user could hold both
answers at once. now that `--of tree` and `--of grove` both render real data side by side, one
session reads **two answers to one question** (*"which lane is dear?"*), with no surface that
discloses the difference.

🟡 **and an undisclosed divergence that ships long enough ceases to read as a choice.** the
longer it stands, the likelier a later reader takes it for an accident and repairs it by guess —
which is the one outcome a reserved fulcrum exists to prevent. ⇒ the verdict is cheap now and
dearer each round, so this row's rank against the council's other items has risen even though
its options have not moved.

## 🔴 .a THIRD divergence, found when the lane's two were verified

neither the lane nor i008 named it, and it is the sharpest evidence that these two folds drifted
rather than diverged by design:

| surface | tiebreak when two keys rank equal |
|---|---|
| `--of grove` | `\|\| a.key.localeCompare(b.key)` — a declared, lexical tiebreak |
| `--of tree` | **none** — it falls through to insertion order, i.e. *"order of first sight"* |

🟡 **neither is a defect.** `Array.prototype.sort` is stable by spec, so tree's order is
deterministic and matches its own `.what`. but two folds that answer one question with two
tiebreak rules, in one codebase, is the same undisclosed-divergence shape one layer down — and
a shared fold settles it by construction rather than by a reviewer who happens to read both.

## .where

- `src/domain.operations/review/meter/genReviewMeterReport.ts:146-162` — `getAllBucketsByKey`
- `src/domain.operations/review/grove/genReviewGroveReport.ts:389-401` — `asRollup`
- `src/domain.operations/review/grove/asFullRateTokens.ts` — the `.why` that argues full-rate
- `src/domain.operations/review/meter/genReviewMeterStdout.test.ts` `[case3]` — the clamp that
  refuses a sort-key swap with no column swap beside it

## .the verdict, once ruled

> _unruled._
