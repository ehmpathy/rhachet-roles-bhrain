# F12 · `--stone` is a prefix, so one grant may span several stones

- **rework** = clean · **confidence** = 85% ⬆ · **status** = ✅ **RULED — option B, RATIFIED.** the
  taken option held with its reasons intact; see `.the verdict`

## 🔴 .re-derived at `r5` — TWO sites share the match, and the remedy's PLACEMENT is now constrained

this row cited one site. the source names a second, and says the pair is deliberate:

| the site | the match | what its own comment says |
|---|---|---|
| `route.ts:1948-1956` | `path.basename(f).startsWith(stoneName)` | *"mirrors the same boundary-match semantics `getCurrentPeerMetersForStones` already names"* |
| `getCurrentPeerMetersForStones.ts:25` | `stone.name.startsWith(input.stoneName)` | 🔴 *"the prefix match is the SAME `startsWith` the guard filter uses, so **the meter set and the guard set agree by construction**"* |

⇒ **a mitigation this row never recorded:** a multi-match top-up writes exactly the guards whose
meters it read. so it is **internally coherent**, never a set mismatch — which means the fork is a
**scope** question alone, and that is precisely what `F022` fork E rules on.

🔴 **and a design constraint the 85% grade did not price: the refusal must land at the COMMAND, above
both calls.** a refusal placed inside either transformer would leave the other unbounded and **break
the agree-by-construction invariant** the second site's comment states. ⇒ option B's cost is
unchanged, and its **placement** is no longer free.

🟡 **a third result, and it is a doc defect rather than a design one.** `route.ts:1946` calls these
*"boundary-match semantics"*, and **neither site tests a `.` delimiter** — so `--stone 5` matches
`5.1.execution` **and** a hypothetical `50.playtest`. the comment claims a bound the code does not
implement, and a future reader who trusts it will under-estimate the match's width.

🟡 **the grade holds at 85%, and the reason is worth a line:** the two results pull opposite ways —
the agree-by-construction mitigation **weakens** the hazard's severity, and the second site plus the
false *"boundary"* label **widen** its surface. ⇒ they net to zero, and a grade moved on either alone
would have been moved on half the evidence.

## .the fork

`getTargetGuardPathsForStone` (`route.ts:1948-1956`) matches by `startsWith` on the basename, so
`--stone 5` targets `5.1.execution`, `5.2.verification`, `5.3.playtest` alike. the gate's predicate
takes **one** `stone: string` (`getStoneLiveUrgentConcessionSlugs.ts:19-22`).

> **when one invocation targets N stones, whose warrant does the gate read?**

| option | the gate |
|---|---|
| A | **per target guard** — evaluate the predicate once per matched stone; extend the warranted ones, refuse the rest |
| 🔴 B | **refuse a multi-match outright** — exit 2, name the matched stones, say to name one |
| C | **read the named prefix's FIRST match** — one warrant licenses the whole set |
| D | do naught — leave the prefix and the singular predicate mismatched |

## .taken, and why

🔴 **option B**, and it is the least certain call on this board.

1. **req 1 sets the posture.** *"a budget grant is refused by default."* where the gate cannot tell
   which stone earned the round, the default answer is **no**, and a refusal that names the matched
   stones costs the driver one word.
2. **`rule.prefer.prevent-over-correct` rung 2 beats rung 3.** option B makes the ambiguous call hard
   to express; option A makes it expressible and then reports on it afterward. the ladder says reach
   for the highest rung the case allows, and this case allows rung 2.
3. 🔴 **option A introduces an outcome shape this cli has never emitted.** today a top-up succeeds
   wholly or exits 2. a **partial** success needs a new render, a new exit-code question (0? 2?), and
   a new snapshot family. that is real scope for a case a driver reaches by accident.
4. **option C is the defect stated as a design**, and option D ships the defect unnamed.

## 🔴 .the census that was owed, and run — it cuts BOTH ways, toward option B

**the open question was whether a deliberate multi-stone top-up is a usecase the repo relies upon.**
a repo-wide sweep of `route.guard.budget --stone` invocations (source, tests, snapshots, briefs,
dreams, and this route's own demos) returns **~35 hits, and every one names a FULL stone**:
`1.vision` · `1.test` · `5.1.execution`. **no test, no snapshot, no doc, and no brief takes a
deliberate prefix.**

⇒ **option B's ergonomic cost is near zero.** it removes a convenience that, on the evidence, no
caller uses — which is the argument the row could not make before the sweep.

### 🔴 and the sweep found the hazard is WORSE than "a driver typed a lazy prefix"

`stepRouteDrive.integration.test.ts.snap:148` prints, from the **engine**:

```
rhx route.guard.budget --for review --add N --stone 1
```

that is not a lazy driver — **the halt interpolates the stone's own name**, and the fixture's stone is
named `1`. ⇒ **wherever one stone's name is a PREFIX of a peer's, the engine's own printed remedy is a
multi-match**, and the driver who copies it verbatim did no wrong at all.

⚠️ **and that shape is this repo's own convention, not an exotic case** — `5.1` beside
`5.1.execution`, `1.vision` beside `1.vision.deep`. the collision needs no adversary and no typo; it
needs two stone names that nest.

🔴 **so the two findings compound in one direction:** the cost of option B is near zero, and the
hazard reaches a driver who followed the engine's own instruction. `rule.forbid.surprises` and
`rule.require.errors-name-the-fix` are both engaged — an engine that prints a command whose blast
radius exceeds what the halt described is the pit-of-failure shape.

🟡 **the mitigation for the lost convenience is `--level`, which already exists** and scopes *"EVERY
lane at a rung"* (`route.ts:2220`). not the same axis — a level is a review rung, a stone prefix is a
route position — so it covers some of the loss and not all. **on the census evidence, there is little
loss to cover.**

## 🔴 .the precedent this row improvised past — found at `r3`, and it is a RULED verdict

**a council has already ruled this exact question, on a second scope field of this same command.**
the source cites it three times, by id:

| site | what it says |
|---|---|
| `route.ts:2176` | `--level   review level to extend — reach a LOWER level only when you name it (F022)` |
| `route.ts:2290` | *"the peers a bulk add may touch, per **F022 fork E**"* |
| `computeBudgetTargetSlugs.ts:5-8` | *"**fork E of F022 forbids a blanket top-up**: a level stays exhausted unless it is EXPLICITLY named"* |

⇒ **one command, two scope fields, one principle:**

| | the scope | the answer |
|---|---|---|
| `F022` fork E — **ruled** | a bare `--add` across **LEVELS** | a wide default is forbidden; a lower level is reached **only when named** |
| this row — **open** | a `--stone` prefix across **STONES** | refuse the multi-match; make the driver name the stone |

### 🔴 and it is the THIRD application, not the second — found at `r5`

`computeBudgetTargetSlugs.ts:18-25` records a defect **inside the level field itself**, found and
repaired:

> *"a named `--level` on a never-run stone fell through to `null` … `isPeerBudgetLineInScope` then
> reads `null` as unscoped and extends EVERY configured peer, **the exact blanket sweep F022 fork E
> forbids**."*

| # | the field | the state |
|---|---|---|
| 1 | **levels**, by a bare `--add` | **ruled** — `F022` fork E |
| 2 | 🔴 **levels**, by a short-circuit order defect | 🔴 **shipped, then repaired** — the hazard was real, never argued |
| 3 | **stones**, by a `--stone` prefix | this row, **open** |

⇒ **row 2 is this row's sharpest evidence, and the board did not carry it.** every other argument
here is a claim that the hazard *would* bite; row 2 is a case where it *did*, in this same command,
and cost a repair. 🟡 **the grade holds at 85% regardless** — it raises the hazard's credibility and
says naught about which remedy shape a council prefers, which is this row's sole open half.

### 🔴 and the precedent's OWN ROLLOUT was incomplete — a caveat this row's argument owes

this row leans on *"`F022` fork E is paved pavement; the design improvised past it"*
(`rule.always.reuse-pavement-before-improvise`). **that argument is weaker than it reads, and the
weakness was found at `r5`:**

`formatRouteGuardReviewPeerAbsorptionAck.ts:59-62` still justifies its `--peer` scope with *"the bare
form re-arms **every lane on the stone, l1 included**"* — the pre-fork-E blast radius.
`computeBudgetTargetSlugs.ts:56-65` made that false for every stone whose meters are non-empty, and
**this operation renders only for stances, which cannot exist before a run.** ⇒ the one case the
comment describes is the one case it can never be in.

| what fork E changed | what it left behind |
|---|---|
| ✅ the **behavior** — a bare `--add` lands on the latest level | 🔴 a peer operation's **justification**, still sized to the old radius |

⇒ **so the pavement this row cites is real and its markers are not all repainted.** two consequences
a council should weigh:

1. 🟡 **it cuts against option D and toward a remedy, WEAKLY.** a principle whose rollout left a
   stale justification is one that may be mis-applied again — an argument to mechanize the stone
   field rather than leave it to a reader's care. ⚠️ **weakly, because the rollout was PARTIAL rather
   than absent**: `formatBlockRemedyGroups.ts:89-95` — a second renderer of the same command —
   carries fork E accurately and in detail. ⇒ **one missed site of at least two**, which is an
   ordinary rollout gap rather than evidence of a principle nobody can apply
2. 🟡 **it does not move the fork.** which remedy (A vs B) is still the open half, and a rollout gap
   says naught about refusal-vs-partial-success

⇒ caught rather than repaired — the file is outside this route's change surface and the fix needs a
`git log` check to settle which artifact is stale:
`.dream/v2026_09_17.fix.the-absorption-ack-justifies-its-scope-with-a-blast-radius-the-code-no-longer-has.md`,
symlinked at `$route/dreams/`. **the grade still holds at 85%** — the two consequences pull against
each other and neither reaches the fork.

🔴 **option B is not a new posture. it is `F022` fork E applied to the field `F022` did not reach.**
and the source states this row's own argument, in the council's words, at `:2179-2181`: *"a top-up is
a deliberate, targeted act, never a blanket sweep that silently heals a level the route author
bounded on purpose."* ⇒ swap `level` for `stone` and that sentence is option B.

⚠️ **so this row improvised a remedy the repo had already paved** — `rule.always.reuse-pavement-
before-improvise`'s *"a second path laid beside a serviceable one, because the author did not look."*
the cost was a lower grade and a longer argument, never a wrong answer.

🟡 **the cue that would have caught it: a shipped verdict leaves its citation in the SOURCE comments,
never in a peer route's fulcrum board.** the groundwork swept the route directories and not the code.

## .rework, and why

**clean.** option B is one length check on `targetGuards` plus a refusal branch, at the same slot the
gate already occupies. option A is a loop plus a new render — **still clean, and larger.**

## .confidence, and why it is 85%

🟡 **it opened at 50% — the lowest on the board — and rose twice, each time on evidence rather than
on a second opinion of the same evidence.**

| round | grade | what moved it |
|---|---|---|
| `r1` | 50% | the hazard is certain; the **remedy** is a coin-flip between a real ergonomic loss and a real format cost |
| `r2` | 78% | the census: the ergonomic loss is **~0 by measurement**, and the hazard reaches a driver who **followed the engine's own printed command** |
| 🔴 `r3` | **85%** | `F022` fork E — **a council already ruled this principle** on this command's other scope field. option B is its second application, never a new posture |

**the 15%:** a council may still prefer option A's per-guard evaluation on the grounds that a refusal
is a worse experience than a partial success, and may judge the partial-success render worth its
cost. and the sweep measures **this repo**, never every route a consumer writes — a downstream route
that leans on prefix top-ups would be invisible to it.

🟡 **`F022` raises this row and does not settle it** — it ruled the *principle* (a wide default is
forbidden) and not the *shape* of the refusal, which is where option A and option B actually differ.

⇒ **what would still settle it:** a wisher's call on whether a refusal or a partial success is the
better shape when one command names several stones.

## 🔴 .the second defect this row carries — where the gate can actually sit

the yield placed the gate at `route.ts:2140`, *"at the head"*. **the source refuses it:** `route` is
resolved at `:2242-2250` and the stone's guard set at `:2264`, and the predicate needs both.

⇒ **the gate sits after `:2264`, before the write at `:2312`** — the slot the extant comment at
`:2271-2276` already reserves for exactly this read-before-write reason. **corrected in the yield at
`r2`; not a fork, a repair.**

## 🟡 .and it bounds `F09`

`F09` claims *"the gate precedes the scope parse."* true of the **lane** scope (`--peer`, `--level`,
parsed `:2196-2224`); false of the **stone** scope, which resolves at `:2264`. ⇒ `F09` holds with the
boundary named, and this row is why the distinction carries weight.

## .where

`1.vision.experience.case=10.the-prefix-that-spans-stones.md` — the demo ·
`route.ts:1948-1956` — the prefix filter · `route.ts:2264` — where it resolves ·
`getStoneLiveUrgentConcessionSlugs.ts:19-22` — the singular contract

## .the verdict

✅ **RULED 2026-09-18 — option B. the multi-match is REFUSED outright.**

> a `--stone` that resolves to more than one guard is refused, and the refusal **names the stones it
> matched** so the driver re-runs with the one it meant.

⇒ **the taken option held, and the council RATIFIED rather than decided** — which is what this row
asked of it. `F022` fork E already ruled this principle on the **level** field
(`computeBudgetTargetSlugs.ts:5-8`); the verdict applies it to the **stone** field, so the command
now refuses a blanket sweep on both of its scope axes.

### 🔴 the placement constraint the `r5` re-derivation found is now BINDING

the refusal lands **at the command**, above both `startsWith` sites:

```
route.ts (routeGuardBudget)          ← 🔴 the refusal lands HERE
   ├─ getTargetGuardPathsForStone     (route.ts:1948-1956)
   └─ getCurrentPeerMetersForStones   (getCurrentPeerMetersForStones.ts:25)
```

⚠️ **a refusal inside either transformer breaks the invariant the second one states** — *"the meter
set and the guard set agree by construction."* ⇒ the two calls must still match identically; what is
refused is the **invocation**, never one of its halves.

### .what moves

| artifact | change |
|---|---|
| `routeGuardBudget` | a length check on the resolved guard set, plus a refusal that lists the matched stones |
| 🔴 the halt renderer (`formatRouteDriveHalts`) | it prints `--stone <the stone's own name>` (`stepRouteDrive…snap:148`). where that name is a prefix of a peer's, **the engine's own remedy is now a refusal** ⇒ it must render a form the gate accepts |
| the acceptance suite | a multi-match case — `case=10` `[t0]`–`[t5]` is the sketch, and `[t6]` is the halt's own repair |
| 🟡 `route.ts:1946` | the *"boundary-match semantics"* comment claims a `.` bound neither site implements. **not this behavior's defect, and it sits on a line this change touches** ⇒ `rule.prefer.scouts-honor`: correct the comment, or implement the bound it claims |

### 🟡 what the ratification cost

**near zero, and that was measured rather than argued.** a repo census found ~35 extant `--stone`
invocations and **every one names a full stone** ⇒ no test, snapshot, doc, or brief relies on a
multi-stone top-up.

🔴 **this is the only row on this board graded against a measurement and then against a ruled
precedent, never against an argument** — 50% → 78% → 85% — and it is the only row whose taken option
survived a council with its reasons intact. ⇒ **the two facts are related**: a row that cites a
verdict rather than an inference is a row a council can only ratify.
