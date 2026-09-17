# fulcrum F1 — where the concurrency group is declared

**rework** — clean · **status** — 🔴 **SETTLED by the wisher, 2026-09-08 — option B** ·
**confidence** — n/a

## 🔴 .the verdict — B, confirmed against the comparison's own criteria

seed **S6**: the wisher checked all four columns — knowledge where held, the 5-of-8 split,
F3-compatibility, and *names WHY* — and took **B**.

```yaml
reviews:
  peer:
    - slug: alpha-checker
      level: 1
      group: anthropic        # ← MEMBERSHIP, on the reviewer
  groups:
    anthropic:
      concurrency: 10         # ← THE BOUND, on the group
```

⚠️ **two sub-questions stay open and are clean either way** — see `.what stays OPEN` below
(one group or several) and fulcrum **F2** (is `10` the default, or only a declared value).

---

## 🔴 .the reframe — the fork asked which artifact carries ONE fact, and there are TWO

the wisher (seed **S4**) named the concept this fulcrum had approached and not caught:

> *"only the author of the guard file will know which guards hit the same ratelimits, so only
> they'll know which **concurrency group** to cluster each reviewer in"*

⇒ **a bound belongs to a RATELIMIT, never to a rung.** those are orthogonal axes:

| axis | governs | decided by |
|---|---|---|
| **rung** (at level `n`) | *order* — l1 gates l3 | the ladder's design |
| 🔴 **concurrency group** | *contention* — who shares a ratelimit | 🔴 which provider each reviewer calls |

a rung of 8 may hold **5 reviewers on one provider and 3 on another**. a per-rung bound cannot say
so — it throttles the 3 needlessly, or trips the ratelimit of the 5.

⚠️ **the wish's example concealed this, honestly**: *"l1 is infinite, l3 is 1 at a time **due to
ratelimits**"* named ratelimits as the cause all along — but there each rung *was* one group, so
**rung was a serviceable proxy for group** and the two axes read as one.

### 🔴 the structural fact the old fork missed

**a bound is a property of a SET.** *"this reviewer has concurrency 10"* states no fact — 10 of
**what set**? so two facts must be declared, and the old fork asked which single artifact carries
both:

| what | belongs | why |
|---|---|---|
| **membership** — which group is this reviewer in? | 🔴 **on the reviewer** | *"which group to cluster **each reviewer** in"* — the author decides it reviewer-by-reviewer |
| **the bound** — how many of that group at once? | 🔴 **on the group** | a cardinality describes the set, not a member |

## .the fork, restated — five options, on the wisher's criterion

**the criterion is S4's, and it is harder than the ergonomic one this fulcrum was first weighed on:**
*the declaration site is chosen by **who holds the knowledge**.*

| # | shape | membership | bound |
|---|---|---|---|
| **A** | the rung IS the group | implicit | `levels: { 3: {concurrency: 1} }` |
| **B** ✅ | label + group map | `group: anthropic` on the reviewer | `groups: { anthropic: {concurrency: 10} }` |
| **C** | the group lists its members | `members: [alpha, gamma]` in the group | in the group |
| **D** | a bare number on the reviewer | implicit — equal numbers? | repeated per reviewer |
| **E** | named group **and** bound on the reviewer | `group: {name: x, concurrency: 10}` | repeated per member |

| # | author's knowledge, where held | 5-of-8 partial clusters | F3-compatible | names WHY |
|---|---|---|---|---|
| A | ❌ must restructure the **ladder** to express **contention** | ❌ a rung carries one bound | ✅ | ❌ `l1` explains naught |
| **B** | ✅ written on the reviewer, as the author thinks it | ✅ | ✅ declared once | ✅ `anthropic` |
| C | ⚠️ membership lives away from the reviewer — two lists to keep, and a reviewer's group is invisible when you read it | ✅ | ✅ | ✅ |
| D | ✅ local | 🔴 **ambiguous** — two `concurrency: 10`: one group of 10, or two of 10? | ❌ requires the duplicates F3 refuses | ❌ |
| E | ✅ local | ✅ | ❌ same bound restated per member | ✅ |

🔴 **D's ambiguity is fatal and is not catchable** — both readings are valid yaml, so no parse check
can part them. a bare cardinal cannot name the set it bounds.

## .taken — B, and the old fork DISSOLVES rather than resolves

| the old fork | what it was right about |
|---|---|
| option A — *per-reviewer field* | ✅ **membership** belongs there |
| option B — *a separate map* | ✅ **the bound** belongs there |

⇒ **both halves were right about different facts.** the fork was a false binary because it assumed
one artifact carries both — the same shape as F4's dissolution by S2, and the second time this round
that an enumeration the fulcrum never ran was the thing that settled it
(`rule.require.enumerate-before-you-name`).

## 🔴 .and this DEFUSES the disqualifier that was the sharpest argument against this fulcrum

peer review i004/r2 found that a separate map can name **a level nobody sits at**, where a bound on
the reviewer structurally cannot. under B that asymmetry inverts:

| failure | under B | severity |
|---|---|---|
| an **orphan group** — declared, nobody joins | possible | ✅ **harmless.** it throttles no one. a warn, not an error |
| 🔴 an **unresolved reference** — `group: anthropik`, a typo | possible | 🔴 **must be refused at parse** — it would otherwise fail OPEN, this fulcrum's stated disqualifier |

⇒ **the dangerous failure is now plain reference integrity**, the most standard validation there is —
where the old shape's failure was a *silently inert* bound that looked live. **confidence 72% → 88%.**

⚠️ **the parse duties are unchanged in number and clearer in kind:** validate the key (the parser
rejects no unknown key — see the constraint preserved below), and validate that every `group:`
resolves. the default is normalized **at parse, once**, per the measured drift below.

## ⚠️ .what stays OPEN — one group per reviewer, or several?

**two different resources are in play, and only one is a ratelimit:**

| resource | scope | example bound |
|---|---|---|
| a provider's ratelimit | per group | `anthropic: 10` |
| 🔴 host memory / process count | **global** — every lane, whatever provider | S3's *"even l1 may have a bottleneck of 10"* |

with `anthropic: 10` and `openai: 5`, **15 subprocesses run at once** — and host memory does not care
which provider. #404 measured ~355k-token targets per lane, so this ceiling is real.

| option | shape |
|---|---|
| **(i)** one group per reviewer, plus a separate run-wide cap | `group: anthropic` + a global knob |
| **(ii)** a reviewer joins several groups; a lane acquires from each | `group: [anthropic, hostmem]` — nested semaphores, which `with-bottleneck` composes natively |

⇒ **(ii) is more general and needs no second concept** — a global cap is just a group every reviewer
joins. it costs one thing: membership becomes a list rather than a scalar.

⚠️ **this is the live question for the wisher**, and it is clean either way — a scalar widens to a
list without a teardown.

## .the scope check — this stays inside the wish's boundary

the wish forbids ladder changes: *"levels remain ordered and gated; only intra-level execution
changes."*

🔴 **groups nest inside rungs, so the ladder is untouched.** because rungs are **gated**, an l1
reviewer and an l3 reviewer are never inflight together within one arrive — so a group that spans
rungs never binds. ⇒ **a cross-rung group is inert**, and inert-but-declared is a fail-open surprise,
so it is owed a parse warn of its own.

## .rework — clean

a yaml key, a membership field, and one parse path. to widen membership to a list, or to move the
bound, is a parser change plus the handful of guards that declare one. no caller hardens against it.

---

## _the record as it stood — superseded above_

**status** — open · **confidence** — 72%

## 🔴 .a hard constraint on every option — the parser does not reject unknown keys

added in self-review r1. this constrains the fork rather than settles it, so the confidence is
unchanged — but **any option that fails this is disqualified.**

`parseStoneGuard.ts:47-53` builds the guard from four known keys out of a hand-rolled
`parseSimpleYaml`. **no schema rejects an unknown or misplaced key.**

⇒ so whichever site wins, the parser must **actively read and validate it** — never merely tolerate
it. an author who writes the bound at a near-miss key must get a loud refusal, not a clean parse
with the cap silently absent.

🔴 **the reason this is a disqualifier and not a nitpick:** a concurrency bound is a *safety valve*.
a valve that fails open is worse than no valve, because the author stops to watch for the failure —
and the failure it was meant to prevent is the one the wish names as fatal (*"it 429s, returns
malfunction, and sends the driver to diagnose a reviewer that was never broken"*).

⇒ demonstrated as `[case4]` in `1.vision.experience.case=7...`. the precedent for the refusal is
`assertReviewSlugsGloballyUnique` at `parseStoneGuard.ts:61-74`, in the same function.

### 🔴 a SECOND way the valve fails open — found in peer review i004/r2

the disqualifier was written against a bound at an **unreadable key**. peer review found a bound at
a **readable key that points at an empty level**:

| the author writes | the parser does | the level gets |
|---|---|---|
| the bound at a near-miss key | does not read it | **no cap** |
| 🔴 the bound at level `4`, where no reviewer sits | reads it fine — and it governs no level | **no cap** |

⇒ **two different authoring mistakes, one identical outcome, and neither produces a signal today.**
the second is now verdicted at `guard-author × phantom × consistent` and demoed by c3 `[case3]`.

⚠️ **so the disqualifier is wider than first stated.** it is not merely *"validate the key"* — it is
**validate the key AND its target**. whichever site wins must refuse a bound that names a level no
reviewer declares, or the valve fails open through a door the first version of this fulcrum left
unlocked.

🔴 **and this raises the cost of the `reviews.levels` option specifically**, which is the option this
fulcrum takes. a bound carried **on the reviewer** cannot name a phantom level at all — the level is
wherever the reviewer sits, so the failure mode is structurally impossible. `reviews.levels` is a
*separate* map, and a separate map can always point at a key nobody occupies.

⇒ **confidence holds at 72%, and the reason shifts.** the map's ergonomic win (declare once per
level, not once per reviewer) is unchanged; its cost is now two validations rather than one, both
owed at parse. **that is a real argument for the per-reviewer alternative, and it is recorded here
rather than settled** — the fork stays open for the council, with the fuller cost on the record.

## 🔴 .the glossary says the fork is mis-stated — a level cannot HAVE a concurrency

found while the learner tended this round's terms (2026-09-03). it does not settle the fork; it
**re-frames what the fork is about**, which is why it sits above the options rather than inside one.

`term=route.guard.rung._.choice._.md` declares a distinction this repo settled on 2026-08-14:

| term | is |
|---|---|
| **rung** | the gate-position you climb — the entity that **holds reviewers** |
| **level** | that rung's **numeric coordinate** on the ladder (`1`, `3`, `JUDGE_LEVEL`) |

> *"a rung **has** a level, the way a step has a height … do not collapse the two."*

⚠️ **every artifact in this round says *"each LEVEL declares its own concurrency."*** by the settled
distinction that attributes a behavior to an integer. **a coordinate holds no reviewers, spawns no
subprocess, and pours at no rate.** what has a concurrency is the **rung**.

⇒ the tell is grammatical: *"level 3 runs one at a time"* names a coordinate as the actor;
*"the rung at level 3 runs one at a time"* names what acts.

### 🔴 this is the CAUSE of the discomfort the yield already recorded and could not repair

the vision's `## what is awkward` opens with:

> *"`level: 3` is an **ordinal** … `concurrency: 3` is a **cardinal** … a guard that carries
> `level: 3` and `concurrency: 3` on adjacent lines invites a reader to relate them, and they are
> unrelated. **i have no repair for this beyond the word choice.**"*

**the observation was right and the diagnosis was absent.** the two numbers read alike because they
were about to be written on the same object — and they describe **different objects**. one indexes
the rung; the other counts what the rung admits.

⇒ ⚠️ **and the repair existed the whole time, in this repo, unfound.** the `rung` cluster held it. it
was undiscoverable because `level` — the term `rung` defines itself *against* — **had no cluster of
its own**, so the contrast was only half-dereferenceable. that gap is now closed
(`term=route.guard.level`), and this is a worked instance of
`rule.always.reuse-pavement-before-improvise`: i reasoned to *"no repair exists"* without the look.

### what it does and does not change

| | |
|---|---|
| **does not** disqualify any option | all three can be expressed rung-honestly. this is about what the key **means**, not where it sits |
| **does** re-aim option C | *"reviewers grouped under levels"* is really *reviewers grouped **by rung***, which is the domain-honest shape — C gets a point it did not have |
| **does** sharpen option B | a `reviews.levels` map is a **map keyed BY level, whose values describe rungs**. legitimate, and it must be named and documented as such, never as *"a level's settings"* |
| **does** weaken option A | a `concurrency` field beside `level` on a reviewer reads as a reviewer property that describes a coordinate — two attribution errors at once |
| **confidence** | unchanged at **72%.** it moves a point to C and a point to B and settles neither |

⇒ **whichever option wins, the prose owes the correction.** if the round ships language that hangs a
count off a coordinate, that is a dispute owed to `term=route.guard.level`, never a silent stretch of
the word.

## .the fork, stated fairly

concurrency is a property **of a level**. but a level is currently declared **per reviewer**
(`RouteStoneGuard.ts:57`), and `reviews.peer` is a flat list. so there is no extant place that
describes a level, and the declaration site must be invented.

| option | shape | for | against |
|---|---|---|---|
| **A. per-reviewer field** | `- slug: primo` / `level: 3` / `concurrency: 1` | additive; no new key; sits beside `level` | states one fact N times; two co-members can disagree; the label reads as a reviewer property when it is a level property (`rule.forbid.ambiguous-labels`) |
| **B. a `reviews.levels` map** ✅ | `levels: { 3: { concurrency: 1 } }` | declares once, at the right grain; additive — an absent key means today's behavior; gives levels a home for future per-level properties | a second place levels are named ⇒ a new drift surface |
| **C. reviewers grouped under levels** | `peer: [{ level: 3, concurrency: 1, reviewers: [...] }]` | structurally unambiguous — a level cannot disagree with itself | a breaking change to every extant `.guard` in this repo and downstream |

## .taken, and why at the time

**B.**

- it puts the value at the grain it belongs to. concurrency is not a fact about `primo`; it is a
  fact about level 3, which `primo` happens to sit at.
- it is **additive**. every extant guard in the repo has no `levels:` key and keeps its behavior
  (modulo the default, which is fulcrum F2). C would require an edit to all of them.
- A's flaw is the one the dimensional walk independently surfaced as a **forbidden cell**
  (case 7): two declarations that disagree. B does not eliminate that risk — a `levels` map can
  still hold a duplicate key — but it shrinks the surface from *N reviewers per level* to *one map
  entry per level*, and it makes the duplicate check trivially local.

## .the drift surface B accepts, and its answer

a level named in `levels` but sat at by no reviewer, or vice versa.

⇒ answered at parse: an entry for a level no reviewer declares is **refused**, with the error that
names the level and the levels that do exist (case 3, `[case3]`). the inverse — a level with
reviewers and no entry — is **legal** and means the default. that asymmetry is deliberate: an
absent entry is the common case; a stray entry is almost always a typo.

## 🔴 .a MEASURED precedent for that drift — found in self-review r3, and it is not hypothetical

the section above calls B's drift surface a risk. **it has already happened in this repo, to this
exact field.**

`level` is optional, so its default is applied as `review.level ?? 1` — and that derivation is
copy-pasted across **≥10 sites**: `parseStoneGuard.ts:157` · `runStoneGuardReviews.ts:58` ·
`getAllReviewPeerMeterStatuses.ts:84` · `getReviewLevelByIndex.ts:15` ·
`getOverruledReviewerSlugs.ts:20` · `computePeerUncontemplatedUnforgiven.ts:19` ·
`getStoneGuardReviewPeerUncontemplatedUnforgiven.ts:46` · `formatGuardTree.ts:84` ·
`setStoneAsPassed.ts:442, 1029` · `stepRouteStatusLine.ts:343, 368`.

🔴 **and `getReviewLevelByIndex.ts:7` exists specifically because that copy-paste DRIFTED:**

> *"this transformer is the single source for that map, so the `index + 1 -> level ?? 1` derivation
> is not copy-pasted per call site **(it drifted before — see the level-clearance re-derivation the
> guard consolidates)**."*

⇒ **this cuts two ways, and both are useful.**

| what it shows | which way it cuts |
|---|---|
| a per-level attribute whose default is re-applied at each use **drifts in practice, here, already** | ⬆️ **for B** — one declaration at one grain is exactly the shape that would have prevented it |
| `parseStoneGuard.ts:157` already normalizes `level ?? 1` **at parse**, and the 10 downstream `?? 1`s are dead-defensive residue of the drift | 🔴 **a requirement, not a preference:** `concurrency`'s default must be normalized **at parse, once**, never at use sites |
| B adds a **second** place a level is named, and the level's members are still declared per-reviewer | ⬇️ **against B** — the members and the policy can disagree, which is what case 7 `[case3]` refuses |

**confidence unchanged at 72%** — the evidence strengthens B's *rationale* and strengthens the
*case against* it by an equal amount, which is why the fork stays genuinely open. what it does
settle is a **constraint on every option**: whichever site wins, the default is applied in the
parser and nowhere else. an option that leaves `concurrency ?? Infinity` to be re-applied at N call
sites reproduces a defect this repo has already paid for.

## .why the confidence is 72% and not higher

- ⚠️ **the wisher may prefer A on ergonomic grounds** — all facts about a reviewer in one block
  reads well, and B asks a reader to look in two places to know how `primo` will run.
- ⚠️ **`levels` may want a different name** — it holds level *policy*, not levels. a reader could
  read `reviews.levels` as *"the list of levels"* rather than *"per-level settings"*.
  `reviews.levelPolicy` or `reviews.perLevel` are live alternatives, unsettled.
- the choice between B and C is genuinely close on merit; B wins on migration cost alone, and
  migration cost is the kind of argument that looks smaller in hindsight.

## .rework — clean

a yaml key plus one parse path. to move to A or rename the key is a change in the parser, the
domain object, and the handful of guard files that declare a bound. no caller hardens against it;
no later stone builds upon it.

## .where

- `src/domain.objects/Driver/RouteStoneGuard.ts` — the shape
- `src/domain.operations/route/guard/parseStoneGuard.ts` — `:157` normalizes `level ?? 1` at parse; `:61-74` is the refusal precedent
- 🔴 `getReviewLevelByIndex.ts:7` — the measured drift incident, in its own `.why`
- `1.vision.experience.case=3.author-declares-the-bound.md` — the demo

## .the verdict

_open — for the fulcrum council at the end of the route._
