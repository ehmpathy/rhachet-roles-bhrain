# F18 — a density demo owes no test file of its own

| | |
|---|---|
| **rework** | clean — a new test file, or none. no shipped code moves either way |
| **status** | OPEN — best-guessed *no dedicated file*; the council may call for one |
| **confidence** | 🔴 70% |
| **raised** | i019, by `enroll-impl-behavior-intent` |

## .the fork

`1.vision.experience.case=6` sketches four `[tn]` blocks. three of them — `[t0]`–`[t2]` — are
reads that a **neighbour's** suite already proves at assertion grain:

| the sketch | what it reads | what stands behind it today |
|---|---|---|
| `[t0]` | a tree roll-up total | `genReviewMeterStdout.test.ts [case1]` |
| `[t1]` | the per-reviewer split | `genReviewMeterStdout.test.ts [case1]` |
| `[t2]` | the cache share | `asCacheHitRate.test.ts [case1]` |
| 🔴 `[t3]` | the cache share **ROSE** after a repair | **naught** — and it is a blocker, absorbed separately |

⇒ so the fork is narrow: **does `case=6` owe a test file of its own for `[t0]`–`[t2]`?**

### taken — no dedicated file

what earns `case=6` a `case=N` file beside `case=1` is **boundary density**
(`define.experience._.metric=boundary-density`) — the same cell walked at six boundaries rather
than one. density is a property of the **narrative**, never of a distinct assertion set.

⇒ a dedicated suite would re-seed `genReviewMeterStdout.test.ts [case1]`'s fixture under a
second name and assert the same three reads, which is the duplication
`rule.prefer.wet-over-dry` refuses — and a duplicated fixture is the shape that drifts.

### the road not taken — one file, all four

`rule.require.experience-catalog-evolution`'s forward terminus reads *"every critipath in the
catalog owes a **real test** that exercises it."* it says naught about a test that exercises a
**neighbour's** cell. so a strict read says `case=6` owes its own suite, whatever `case=1` has.

🔴 **and that read has a real point behind it**: the mapping *"`[t0]` is proven by `[case1]`"*
lives in prose, in the catalog. the suite itself never names `case=6`, so the link is a claim a
reader must take rather than a reference a tool can follow.

## .why it was best-guessed rather than halted

`rule.always.defer-fulcrums-to-last`. the rework is **clean** in both directions — a new test
file adds, it moves no shipped code, and no caller depends on its absence. so the cost of a
wrong guess is one file, either direction, at any later stone.

## 🔴 .the cheap middle, if the council wants the link mechanical

a third option no one has to rule on: **add `[case6]` labels as comments to the three assertions
in `genReviewMeterStdout.test.ts` / `asCacheHitRate.test.ts` that already prove `[t0]`–`[t2]`.**
that makes the catalog's claim greppable without a duplicated fixture, and it costs three lines.

⇒ it is not taken here only because it is a coverage-contract convention this repo has not
declared, and a driver who invents one mid-drive has invented a convention rather than followed
one (`rule.always.reuse-pavement-before-improvise`).

## .where it lives

- `1.vision.experience.case=6.a-driver-prices-the-review-round-they-just-drove.md` — the sketches
- `1.vision.experience.case=_.md` → `## 🔴 .the forward terminus` — the 6-row proof table
- `src/domain.operations/review/meter/genReviewMeterStdout.test.ts` `[case1]`
- `src/domain.operations/review/asCacheHitRate.test.ts` `[case1]`
