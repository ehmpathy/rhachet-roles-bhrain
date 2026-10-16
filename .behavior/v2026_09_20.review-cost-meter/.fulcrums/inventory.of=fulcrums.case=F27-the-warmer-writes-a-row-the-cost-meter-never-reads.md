# fulcrum F27 — the warmer writes a row the cost meter never reads

- rework = **clean** — the row is already durable and correctly placed; what is absent is a reader
- status = ✅ **RULED + fully BUILT 2026-09-24** — **B at `run`, D at `tree` and `grove`**
- confidence = 🟡 85% → 🔴 70% → ✅ **built**, and the deferral it records is now history
- raised.by = self, at the third thoroughness audit of the warmer objective

## ✅ .the residual closed the same day — by a PEER, on the fork this fulcrum named

the verdict below left exactly one surface open: `genReviewGroveStdout` owed the same
`asWarmerCaveat` its tree peer carried. it now has it, and the two are the same shape —
conditional on `warmersSeen > 0`, and each points at `--of run`.

| breadth | verdict |
|---|---|
| `--of run` | ✅ fork **B** — `getOneWarmerSpend`, 9 assertions, three states as three |
| `--of tree` | ✅ fork **D** — `asWarmerCaveat`, fires only where a warmer ran |
| `--of grove` | ✅ fork **D** — `ReviewGroveReport.warmersSeen`, same caveat, same condition |

⇒ **the figure's stated boundary no longer shifts with the `of` flag**, which is the whole reason
`F7` and `F8` refused fork C. the join itself stays open and is now *named at every breadth* rather
than at one.

🟡 **and the closure vindicates D over A more sharply than the argument below did.** the deferral
rested on *"to touch the peer's file is to author a collision"* — true, and the peer simply built
it themselves, from the fork written down here. ⇒ **a fork recorded in a fulcrum is reachable by
whoever gets there first.** that is a better outcome than either horn of the original dilemma, and
it works only because the fork was written down rather than left as a shrug.

🔴 **the residual that remains is the JOIN, and it is now the honest one:** no breadth SUMS the
poke spend into its total. every breadth says so. `case=7 [t4]` accepted exactly that, and the
`chars`-column cells for the engine half (`0.wish`, *"what stays open"*) are what is left.

## ✅ .the verdict, taken the same day it was deferred

the deferral below was overturned by its own argument. it rested on *"a peer is mid-flight in
these files"* — and that ground held for **one** of the three surfaces, never all three:

| breadth | whose file | what shipped |
|---|---|---|
| `--of run` | mine (`meter/`) | ✅ **fork B** — `ReviewRunMeter.warmer`, read, rendered, clamped |
| `--of tree` | mine (`meter/`) | ✅ **fork D** — a caveat that NAMES the exclusion and counts the runs |
| `--of grove` | 🔴 the peer's untracked `grove/` | 🔴 open — the one surface the original ground actually covers |

⇒ **the deferral was correct about the obstacle and wrong about its reach.** two of three surfaces
were never the peer's, and a re-read of `git status` is what parted them — the *same* check that
overturned the `reviewWarmerFlag` deferral hours earlier, on this same branch, for this same
author. S12's lesson, twice in one day.

### what closed, and what it cost

- `getOneWarmerSpend` — reads `warmer.pokes.jsonl`, `null` where absent, **fails loud** on a torn
  row. 9 assertions, clamp **proven red** under a collapsed null/zero
- `ReviewRunMeter.warmer` — a **required** field, so all six construction sites had to state it.
  that is the type thread the residual below asked for, and it is what makes the join non-optional
- `genReviewRunStdout` — renders three states as three. clamp **proven red** (5 failures)
- `asWarmerCaveat` at `tree` — fires only where a warmer ran. clamp **proven red** (3 failures)
- 7 acceptance snapshots moved, each one the intended row and no other change

### 🔴 what the join surfaced on its FIRST live read

```
│  ├─ cost: $0.000109706
│  └─ warmer: $0.001420008  over 2 pokes, 1 of which HIT
```

**the warmer cost 12.9× the review it protected** — and worse, the pokes landed 68s and 129s
*after* the review they are attributed to. so that spend protected a **next
round that never came**: the dogfood ended.

⇒ that is `0.wish`'s own named weakness — *"a guard whose budget is already exhausted still spawns,
and the warmer then pokes for a round that will not come"* — **observed live rather than
predicted**. and no surface on this branch could have shown it before today.

🟡 the figure does not generalize: a 1-lane 3.2k-token toy scope, whose warmer cost is 97.4% poke
1's MISS. a real lane's prefix is ~58k and the arithmetic inverts. **what generalizes is that the
question became askable at all**, which is exactly what the purpose clause was for.

## .the deferral this fulcrum originally recorded

_the argument below stands as written. it is kept rather than rewritten, because the fork
list and its miss are the fulcrum-grade facts here — and the verdict above is only legible
against them._

## 🔴 .ESCALATED at the fifth pass — this is an unmet CRITIPATH sketch, not only a wish clause

the row below grades this against `0.wish` bar 9. a re-read of `case=7` shows it is **also** an
open `[tn]` on a **demoed critipath**:

```
[t4] given a driver asks what this tree's review cost
     when  they run `review._.cost --of tree`
     then  the warmer's spend is included, or NAMED as excluded
     and   never silently omitted — an omitted cost reads as $0, which is the lie
           `case=2` forbids at driver agency and this case forbids at engine agency
```

⇒ that changes the grade of the deferral, not the deferral itself.
`rule.require.experience-catalog-evolution` makes an unmet critipath sketch a **blocker at the
verification terminus**, where an unbuilt wish clause is merely unbuilt. **the debt is the same
work and a harder obligation.**

🔴 **and it is a weaker deferral than the board's other open row.** `case=6 [t3]` cannot close at
execution — it needs a live brain and two rounds, and a hermetic fixture would assert the fixture.
`[t4]` **can** close at execution; what stops it is a peer's live files and snapshot churn. ⇒ a
ground of schedule, against a ground of principle.

## .the fork

wish bar 9 reads:

> every poke writes a durable row **beside the review output logs it protects** — same run dir
> under `.log/bhrain/review/`, **so `review._.cost` reaches it** and a reader finds it where they
> already look.

three claims, and only two are built:

| the read | verdict |
|---|---|
| the bar's NAME — *"a warmer's spend is RECORDED, per lane"* | ✅ **met** — every poke and every defer writes a row |
| the bar's TEST — *"a durable row beside the review output logs"* | ✅ **met** — `$logDir/warmer.pokes.jsonl`, in the run dir |
| 🔴 the bar's PURPOSE CLAUSE — *"so `review._.cost` reaches it"* | 🔴 **unbuilt** |

the check that found it is one grep:

```sh
rhx grepsafe --pattern 'warmer.pokes' --path src
```

it returns the warmer and its own tests. **no meter, no fold, no renderer.**

## 🔴 .why it matters more than an unread file usually would

this branch's opening defect is that an engine act spent real money with no row behind it. the
warmer now writes the row — and `rhx review._.cost` still reports a figure that is **true about
reviews and silently incomplete about the bill**.

⇒ that is the wish's own opening defect, one layer lower, and it is worse in one respect: the
earlier gap was *unanswerable*, where this one is **answered wrong with confidence**. a driver who
reads `$0.34` for a tree has no cue that a spender ran beside it.

🟡 the magnitude is small — 3 pokes per lane, near a tenth of a cent at the rate card — so the
harm is the **claim**, never the money. a meter that omits a known spender is an instrument that
has stopped being exhaustive without saying so.

## .the three forks, stated fairly

### A — defer, with the shape of the fix named (taken)

- the fix is **DIRTY** by the SAFE/CLEAN test: it threads a field through
  `ReviewRunMeter` → `genReviewRunStdout` → the tree fold → the grove fold, and moves 3+ snapshot
  sets across two acceptance suites
- 🔴 **two of those surfaces sit in a peer's untracked `src/domain.operations/review/grove/`**,
  under active edit for the polluter work. to touch them is to author a collision the peer would
  have to settle, in files they did not ask me to enter
- ⇒ so it is caught as a dream with the residual shape written down, and a fulcrum records that
  the deferral was a decision rather than an omission

### B — build it now, across every breadth

- closes the purpose clause today, and the bill stops under-reporting
- 🔴 and it lands a cross-cutting field into a peer's live files mid-flight, plus a snapshot churn
  across `reviewCost` (194 cases) that would bury the warmer diff it exists to surface
- the honest cost is not the code; it is that **two drivers would be editing one fold at once**

### C — narrow it to `--of run` only, and leave tree and grove alone

- cheapest build, touches no peer file, and answers *"what did THIS round cost?"* completely
- 🔴 and it reintroduces the exact defect `F7` and `F8` already ruled against: a figure that means
  one thing at one breadth and another at the next. a driver who sums three `--of run` readings
  and compares them to `--of tree` would find they disagree, with no line to say why

### 🔴 D — state the omission rather than close it (the fork the first pass MISSED)

`[t4]` accepts two satisfactions and the fulcrum's first draft weighed only one: *"included, **or
NAMED as excluded**"*. so a **caveat** discharges the sketch — the same shape `asUnknownCaveat` and
`asCacheCaveat` already take on the cost line:

```
   │  └─ cost: $0.34  ⚠️ excludes warmer pokes — see warmer.pokes.jsonl
```

🔴 **this is materially cheaper than B**: no `{pokes, hits, cost}` object, no arithmetic, no fold
of a new quantity. an honest conditional form needs one **boolean** on the meter — *does this run
dir hold a warmer file* — which is an `isPathPresent` call and a `some()` in the fold.

🟡 **and it is still not free, for the reason C was refused.** the grove renderer lives in the
peer's untracked `grove/`, so a tree-only caveat would say *"warmer spend excluded"* at `--of tree`
and stay silent at `--of grove` — a figure whose stated boundary shifts with the breadth flag,
which is the defect `F7` and `F8` each ruled against.

⇒ **D is the first move once the peer's work lands**, and it is recorded here rather than in the
dream because the miss is a fulcrum-grade fact: *a fork list drawn from the bar's prose and never
re-read against the demo's own `[tn]`*.

## .why A was taken

the bar's name and its test are met, so what is deferred is a **capability the bar anticipated**,
never a bar failure — and `rule.always.fix-forward-under-scouts-honor` sends a dirty fix to a
dream rather than into the diff that found it. B's real cost is the collision, not the work. C
buys speed with an axis inconsistency two prior fulcrums already refused.

🟡 **the honest discomfort: the purpose clause is the half a reader cares about.** *"a row exists
on disk"* is a builder's claim; *"the meter reaches it"* is the driver's. to ship the first and
defer the second is to lay the pipe and defer the tap.

🔴 **and the discomfort grew at the fifth pass.** A was chosen against three forks that all BUILD
the join; D — merely STATE the omission — was available the whole time, written into the demo this
fulcrum defends, and the fork list was drawn from the wish's prose with no re-read of it. A still
holds, because D crosses the same peer seam that refused C. but it holds on a narrower margin than
the first draft claimed, and the confidence above moved for that reason.

⇒ the lesson is the branch's own, one more time: **a record checked against one neighbour is not a
record checked against its neighbours.** the wish and the demo are two sources for one obligation,
and only one of them was read.

## .the residual, as a shape

```
ReviewRunMeter.warmer: { pokes: number; hits: number; cost: IsoPriceWords } | null
   ↑ read from `$dir/warmer.pokes.jsonl`, null where the file is absent — never zero
```

`null` rather than a zero is the whole discipline: a run with no warmer file and a run whose
warmer spent naught are **different facts**, and `asAccountedCost`'s `unknown` vs `refused` split
already draws that line everywhere else in this branch.

then it folds the way every other figure folds — summed at `tree`, summed at `grove`, with the
unmetered census counting a run whose warmer file could not be read.

## .where

- `src/domain.operations/review/warmer/setOnePokeRow.ts` — the writer
- `src/domain.operations/review/meter/getOneReviewRunMeter.ts` — the reader that would gain the field
- `.dream/v2026_09_24.feat.the-cost-meter-omits-the-warmers-spend.md` — the caught dream
- `0.wish.md` bar 9 — the clause this grades against

## .the verdict

✅ **B at `--of run`, D at `--of tree`, and `--of grove` left open under the ONE ground that
survives a `git status`.**

the residual is exactly one surface and one line: `genReviewGroveStdout` owes the same
`asWarmerCaveat` its tree peer now carries, so a figure's stated boundary stops to shift with the
`of` flag (`F7` · `F8`). it is a 2-line additive change in a file a peer holds, and it is the first
move once their work lands.

🔴 **and the residual is now LOUDER than the gap it replaces**, which is the point of D: a driver
at `--of tree` reads *"EXCLUDES warmer pokes on N runs — see `--of run`"* and can act. a driver at
`--of grove` still reads a total that is silently short. **the inconsistency is real and it is
stated here rather than discovered later.**

## .see also

- `F7` · `F8` — the two prior rulings against a figure that shifts meaning across breadths
- `F24` — the same shape one level up: a claim whose instrument is built and whose measurement is
  handed onward, named rather than left to be re-found
