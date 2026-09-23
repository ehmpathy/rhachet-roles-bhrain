# F09 · the gate binds every grant scope, and runs BEFORE the scope is parsed

- **rework** = clean · **confidence** = 70% ⬇ · **status** = best-guessed

## .the fork

`routeGuardBudget` accepts three grant scopes. 🔴 **this row stated the default one wrong until `r3`
self-review**, and the correction is recorded rather than swapped in silently:

| the invocation | what it reaches | cited |
|---|---|---|
| `--stone <s>` **alone** — the default | 🔴 **every lane at the LATEST level**, and that level alone | `route.ts:2166`, `:2179-2181` · `computeBudgetTargetSlugs.ts:56-65` |
| `--peer <slug>` | one lane | `computeBudgetTargetSlugs.ts:41` |
| `--level <n>` | every lane at the named level — 🔴 **a level the driver has passed, too** | `computeBudgetTargetSlugs.ts:45-50` |

⚠️ **it read *"`--stone <s>` alone (every lane on the stone)"*, and that is false.** the command's own
help says *"a bare add lands on the **LATEST level alone**. a lower level stays exhausted unless it
is explicitly named."* ⇒ a bare `--add` on a stone with lanes at l1 and l3 does not touch l1.

🔴 **and the vision already held the right answer, in the artifact this row is cited FROM.**
`1.vision.experience.dimensions.md:175` — the §5 note that opened this very row — reads:

> *"`--add N` takes `--peer <slug>`, `--level N`, or neither (**the bare form, which lands on the
> latest level alone**)."*

⇒ **two artifacts of one vision stated one fact two ways, and the row that carried the wrong version
cited the one that carried the right version.** `r1` and `r2` both read past it.

⇒ **the correction CUTS this design's exposure**, which is why it is worth a record rather than a
panic: `F10`'s stone-wide residual reaches the latest level's lanes, and a lower level is already
bounded by a verdict that shipped (`F022` fork E).

**the fork:** does the gate bind all three scopes, and where does it sit relative to the scope parse?

| option | the gate |
|---|---|
| A | per-scope — a `--peer` grant to the lane that conceded is permitted; a wider one is not |
| 🔴 B | **scope-blind** — one predicate over the stone, checked before the scope is read |

## .taken, and why

**option B — and on ONE ground, never the two this row claimed.**

🔴 **argument 1 was struck at `r3` self-review.** it read:

> *"three lanes on a stone, one conceded urgent; under option A the driver grants that lane a round —
> and the other two lanes are still budget-starved, so the driver grants each of them in turn as they
> exhaust. ⇒ the per-lane gate is a stone-wide grant in three commands."*

⇒ **under option A the driver CANNOT grant the other two.** that is exactly what option A does — a
`--peer arch-bounds` grant, where `arch-bounds` conceded naught, is refused by option A's own
definition. **the argument assumed option A permits what option A forbids.**

⚠️ **and the charitable read does not rescue it:** if the other two lanes each concede urgent in due
course, each earns its own grant — three grants, three concessions, one apiece. that is **no leak**;
it is option A at work.

**what stands, and it is sufficient on its own:**

1. **the predicate has no lane to compare against.** `getStoneLiveUrgentConcessionSlugs` returns the
   slugs that conceded — but the driver's grant target need not be one of them, and req 2 says the
   evidence is that *a round was earned*, never that *this lane earned it*. ⇒ naught in the wish
   ties the concession's lane to the grant's lane.

**and where it sits follows from failure order.** `route.ts:2140-2353` validates flags, rejects
`--peer`+`--level` (`:2216-2224`), looks up the route (`:2242-2250`), enumerates guards (`:2253`),
filters to the stone (`:2264`), then writes (`:2312`).

- a refused grant with a **malformed** `--peer` should refuse for the budget reason, never the typo
- the extant comment at `:2271-2276` already argues this exact order for the dispute read —
  *"read first and a malformed route fails fast with the budget untouched"*

## 🔴 .the boundary this claim needs — added at `r2`, and it is load-carrying

**this row said the gate sits at the HEAD, before the scope is read at all.** that is true of one
scope and impossible for the other:

| the scope | parsed at | the gate |
|---|---|---|
| the **LANE** — `--peer`, `--level` | `:2196-2224` | ✅ **precedes it**, so the scope-blind call reaches these two before either is read |
| 🔴 the **STONE** — `--stone` | `:2264`, via `getTargetGuardPathsForStone` | 🔴 **cannot precede it** — the predicate takes `{ route, stone }`, and **neither value exists** before `:2250` / `:2264` |

⇒ **the gate sits after `:2264` and before the write at `:2312`** — still a read-before-write, still
the slot the `:2271-2276` comment reserves, and the failure-order argument is untouched: a malformed
`--peer` is already rejected at `:2216-2224`, above the gate either way.

🔴 **and the distinction is not pedantic.** `--stone` matches by `startsWith`, so it can name
**several** stones while the predicate takes one. an unbounded *"the gate precedes the scope parse"*
reads as though that never mattered. ⇒ `F12` carries the fork, and `case=10` demos it.

**this row's own call is unchanged** — scope-blind over the **lane**, which is what option B ever
claimed.

## 🟡 .what option B costs — and what option A costs, stated honestly for the first time

**option B's cost:** a driver whose `mech-rules` lane conceded urgent may grant a round to
`arch-bounds`, which conceded naught. that reads odd, and it is the honest consequence: **the
predicate answers *was a round earned?*, never *by whom?*** — and `F10` records this as the
axis-B-alone limit.

🔴 **option A's cost, which the struck argument obscured:** a driver with one urgent concession and
three dry lanes must **converge** the other two, or earn a concession on each. that is more work, and
it is not obviously wrong — it is the wish's own posture applied per lane. ⇒ **option A is a live
option, and the struck argument was the only thing that made it look absurd.**

## .rework, and why

**clean.** option B is one call in one function. to reach option A later is to add a set-membership
test against `targetSlugs` — additive, and no caller is hardened against either.

## .confidence, and why it fell 95% → 70% at `r3`

🔴 **it was 95% on two arguments, and one of them does not hold.** with argument 1 struck, this is a
one-argument row, and the remaining argument is a reading of what the **wish** ties together — a
question of intent, never of arithmetic.

**the 30%:** a council reads option A's real cost above (converge, or earn a concession per lane) and
finds it **preferable** rather than absurd — it is the wish's own posture, applied at the grain the
wish never spoke to. and option B's odd case is a concrete cost a reviewer can point at.

⇒ **what would settle it:** whether a grant must name the lane that earned it.

## .where

`1.vision.yield.md` § *the design* · `1.vision.experience.dimensions.md` §5 ·
🔴 `route.ts:2166`, `:2179-2181` — the help text that refutes the original fork statement ·
🔴 `computeBudgetTargetSlugs.ts:41`, `:45-50`, `:56-65` — the three scope branches, read at `r3` ·
`…case=F12-the-stone-flag-is-a-prefix-that-matches-many.md` — the stone-scope half this defers to ·
`1.vision.experience.case=10.the-prefix-that-spans-stones.md` — the demo

## .the verdict

_not yet ruled._
