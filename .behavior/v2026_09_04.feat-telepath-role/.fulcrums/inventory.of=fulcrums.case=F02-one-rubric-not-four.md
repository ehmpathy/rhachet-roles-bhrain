# F02 · one rubric (`prose-density`), never four

- **rework** = clean · **status** = SETTLED, reversed · **confidence** = 80%, and the guess was wrong

## .the fork, stated fairly

telepath's file-half canon holds four rules. the rubric set is either:

| option | shape |
|---|---|
| **one rubric** | `prose-density` — all four rules in one reviewer |
| **four rubrics** | `narratives`, `roundabouts`, `density`, `refs-out` — one reviewer each |

## .taken, and why at the time

**one.**

- a guard runs `rhx review.by --role telepath --for <rubric>` **once per rubric**, and each is a separate brain call against the same subject
- `case=4` establishes that this reviewer's tightest constraint is **cost and context**, so `4×` the calls is `4×` the overflow risk on the artifact the reviewer exists to shrink
- granularity is not lost: a blocker names the rule that raised it, so a per-rule read survives inside one verdict
- the four rules share one question — *does this prose arrive in one pass?* — which is what a rubric's `purpose` field is for

## .rework, and why

**clean.** the rubric set is a yaml declaration. a split into four is an edit to one file with no caller hardened against it.

## .confidence, and why it is not higher

80% because:

- a guard that wants to **overrule one concern** and not the others cannot, under one rubric. the budget is per-reviewer, so one rubric means one budget across four rules
- if `forbid.narratives` proves noisy on `.demo=` files, a separate rubric would let it be tuned alone
- ⇒ the counter-case is real; it is simply cheaper to split later than to merge later

## .where

- `1.vision.experience.case=7.two-files-wire-the-reviewer.md` — where the decision surfaced
- `1.vision.experience.case=4.the-cure-catches-the-disease.md` — the cost argument

## .the verdict

**reversed by the wisher, 2026-09-07 (`S38`)** — **two rubrics, `structure` and `efficiency`**, and
the fork was stated too narrow: the choice was never `1 vs 4`.

> *"which has different focuses for the various reviews we have so it can be decomposed, but also so
> that it can just be run in bulk? that way, we can get smol brains to help us review"*

then, asked whether `grain` was the right axis:

> *"i'm thinking 1 for structure, 1 for efficiency, on the rubrics front"*

🟡 **the verdict landed near the guess on COUNT and against it on AXIS.** `one` was wrong and `four`
was near right; what the entry never asked was *what the slugs are slugs OF*. so a fork stated as a
number hid the question that settled it.

three of the four arguments for `one` do not survive, and the reason is one fact the entry never
checked — **the base engine already runs every rubric when `--for` is omitted:**

| the argument at the time | after the check |
|---|---|
| `4×` rubrics is `4×` the brain calls | 🔴 the split does not force the calls. bulk is the default, and `--for` narrows |
| granularity survives inside one verdict | true, and it misses the ask. the value is a small brain that holds **one question**, over a reader who sorts a mixed verdict |
| the rules share one question | 🔴 false past the four this entry knew. the canon now carries ~24 rules across eight grains |
| a split is cheaper later than a merge | ✅ this one holds, and it is why the reversal costs one file |

⇒ the deeper defect: the entry priced the split against **cost**, and the wisher priced it against
**who reads it**. a rubric a small brain can hold is the constraint, and cost follows from it rather
than the reverse.

🟡 and one fact the entry could have checked and did not: `--for` was already optional. that is a
`rule.always.reuse-pavement-before-improvise` miss — the base engine's contract settles the whole
`1 vs N` axis, and it was never read.
