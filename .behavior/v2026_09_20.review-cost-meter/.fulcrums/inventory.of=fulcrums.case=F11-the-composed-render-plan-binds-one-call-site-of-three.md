# F11 — the composed render plan binds one call site of three

- raised 2026-09-22, by `enroll-impl-behavior-intent` (A), at i013
- rework: **clean / 🔴 dirty** — the census half is clean; the renderer half is not
- status: 🔴 **OPEN**
- confidence: **95% / 🔴 55%**

## .the fork, stated fairly

`getOneTargetRenderPlan` was built at i012 to compose `isTargetDiffSent` + `isTargetPayloadSent`
into one decision **a caller cannot take half of** — the repair for a defect whose whole mechanism
was that a caller took half of it.

🔴 **and exactly one caller reads it.**

| call site | what it reads today |
|---|---|
| `asTargetContentsForBreakdown` | ✅ `getOneTargetRenderPlan` |
| `compileReviewPrompt` — the RENDERER | 🔴 the two predicates, separately |
| `getOnePromptComposition` — the CENSUS | 🔴 the two predicates, separately |

⇒ so the operation that exists to make a half-wire impossible is wired at the one site that was
already correct, and the two sites that could drift still call the halves by hand.

## 🔴 .why this is worth a row rather than a shrug

**it is not a defect today** — the lane graded it so, and a read of both sites confirms each takes
both predicates, in the right order, with the right focus. the rows agree.

🔴 **the argument is that "they agree today" is precisely what was true of the third site before it
did not.** `isTargetDiffSent` was extracted for this reason, its doc-comment recorded the lesson
in its own words, and the census drifted anyway — because a recorded lesson does not bind a caller.
`getOneTargetRenderPlan` mechanizes the capacity; it mechanizes it for **one** of three.

⇒ this is `F5`'s shape at a different grain: a repair that reserves half its own subject.

| option | the claim |
|---|---|
| **A — wire all three** | the plan becomes the only way to ask, and a half-wire stops to be expressible |
| **B — wire the census only** | the census is where the drift happened; the renderer may legitimately read the primitives, since it is the subject under measure |
| **C — leave it, tracked** | no defect today, and the renderer is the highest-blast-radius file on the branch |

## .rework, and why

**clean, then dirty.** the census is a pure fold whose output is already clamped row by row, so a
re-wire there is a local change with a test that would catch a slip. **the renderer is not**: every
prompt snapshot on the branch pins its output byte-for-byte, and a re-wire lands in the one file
whose defect surface the whole wish is built to measure.

⇒ and the honest note against A: the renderer DECIDES what to send; the census MEASURES it. to
route both through one operation is right if the plan is the decision, and subtly wrong if it makes
the measurement inherit the renderer's answer rather than check it. that is a real design question,
not a tidy-up.

## 🔴 .confidence, and why the two halves differ

**95% that the observation is correct** — three call sites, one wired, verified by read.

**🔴 55% that A is the right repair.** the drift risk is real and the independence of the census is
also real, and they pull opposite ways. a census that reads the renderer's own plan cannot catch a
renderer that changed its mind — which is the failure `rule.require.distinguish-every-review-input`
was written against.

## .where

- `src/domain.operations/review/getOneTargetRenderPlan.ts` — the composed decision
- `src/domain.operations/review/asTargetContentsForBreakdown.ts` — its one caller
- `src/domain.operations/review/compileReviewPrompt.ts` — the renderer, unwired
- `src/domain.operations/review/getOnePromptComposition.ts:4-5` — the census, unwired

## .the verdict, once ruled

> _unruled._
