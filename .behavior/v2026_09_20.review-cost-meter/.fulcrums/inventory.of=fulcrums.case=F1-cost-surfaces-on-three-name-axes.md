# F1 — the three cost surfaces sit on three different name axes

- rework = **clean** (a rename; 3 cli files, 3 skills, their snapshots, and the briefs that cite them)
- status = ✅ **RULED 2026-09-20** — `cost` prevails over `budget`
- confidence = **70%** on the shape, **50%** on the word, at the time of the guess

## .the fork, stated fairly

the three surfaces shipped as `review.meter`, `review.fleet`, `review.corpus`. each name is
defensible alone, and together they name **three different axes**:

| name | the axis it names |
|---|---|
| `meter` | the **instrument** |
| `fleet` | the **scope** |
| `corpus` | the **source** |

⇒ a reader who learns one cannot infer the other two, which is what a name set is for.

## .the wisher's proposals, in order

1. > group them: `review.budget.{fleet,meter,corpus}` — and is `meter` really just `route`?
2. > so, `review.budget.of grove|tree` ?

## .what was settled

### ✅ `tree | grove`, not `tree | fleet` — the wisher's, and it is better

`fleet` is a **mixed metaphor**: a fleet is ships. `grove` is the natural container for
`tree`, and `tree` is already this work's own word — `review.fleet` rolls up `by tree`.

⇒ `tree` / `grove` is a containment pair a reader infers without a lookup, which is exactly
what the three-axis set failed to give.

### ✅ NOT `route` — the wisher's instinct on the axis was right, the word was not

the surface reads a **tree's** log dir, and a tree holds many routes:

- `review.fleet` rolls up `by tree, by route, by stone, by reviewer` — so `tree` and `route`
  are two declared, distinct scopes in this work's own vocabulary
- `review.meter` rolls up `by reviewer, by stone, by round` — **no route axis at all**

### ✅ a VERB, not a preposition, in the command name

`review.budget.of tree` has no verb, so it can only ever read. the extant CLI shape is
`noun.noun.verb --flag value`:

```
rhx route.stone.set    --as arrived
rhx git.repo.get       lines --in ehmpathy/domain-objects
rhx route.guard.budget --for review --add N
```

⇒ reshaped: `rhx review.budget.get --of tree`. `get` because it is a pure read
(`rule.require.get-set-gen-verbs`), `--of` as a named arg (`rule.require.named-args`), and
the verb slot stays open for `set`.

### 🟡 `budget` — taken as the BEST GUESS, on the aspirational reading

the objection, stated fairly: what these commands report is **realized spend**. nothing
allowances it, nothing is constrained by it. a budget is what you are ALLOWED to spend.

| | what it is | the word it earns |
|---|---|---|
| `route.guard.budget` | an allowance you `--add` to, that constrains | budget ✅ |
| `review.budget.get --of tree` | a figure of what was already spent | ledger / cost |

⇒ **two readings, and they pick different words:**

- **aspirational** — an allowance IS intended (`review.budget.set --of tree --max '$5'`, and
  a guard that halts a lane which would blow it). then `budget` is exactly right and `get`
  is its reporting half. the name is ahead of the feature, which is fine
- **read-only forever** — then `review.cost.get --of tree|grove` says what it does, and
  `budget` promises a constraint that does not exist

**taken: the aspirational reading**, because the wisher proposed `budget` twice and the
`set` half is a natural, cheap follow-on. ⚠️ if the answer is read-only, this is a
find-and-replace of `budget` → `cost` and nothing else changes.

🟡 the collision argument I raised first — that `budget` clashes with `route.guard.budget` —
**I now judge weaker than I stated it.** both are allowances of a scarce resource (rounds,
dollars), so it is plausibly ONE concept over two resources rather than two concepts under
one word. the real objection was never the collision; it was that today's surface reports
spend rather than allowance.

## .the best guess, held pending a verdict

```
rhx review.budget.get --of tree                     # this tree, realized     (was review.meter)
rhx review.budget.get --of grove                    # every tree, realized    (was review.fleet)
rhx review.budget.get --of tree  --from declared    # 🔴 the cell with nothing today
rhx review.budget.get --of grove --from declared    # what review.corpus does now
```

## 🔴 .the walk exposed an empty cell, and the reshape fills it

`corpus` was never a scope — it is a **source**. so the real product is two axes:

| | realized (logs) | declared (guards) |
|---|---|---|
| **tree** | `review.meter` | 🔴 **nothing** |
| **grove** | `review.fleet` | `review.corpus` |

*"what will THIS tree's lanes cost?"* has no surface. a reader must run the grove-wide
corpus and find their own row — which is plausibly why `--limit` was reached for at all
(see `F2`).

⇒ once `--of` is a real flag and `--from` names the source, `review.corpus` collapses into a
flag and the empty cell gets a home. **that is the strongest argument for the rename**: a
symmetric set makes the gap obvious where the current set hides it.

## .why it was not halted on

**clean rework.** a rename across 3 cli files, 3 skills, their snapshots, and the briefs
that cite them. no contract shape changes, no behavior changes, and no caller outside this
branch depends on the names — they have never been released.

⇒ per `rule.always.defer-fulcrums-to-last`, a clean rework is best-guessed and flagged, not
halted on.

## .why confidence is not higher

- the **shape** (`get --of tree|grove --from declared`) I would defend at ~85%: it conforms
  to the extant CLI, fills the empty cell, and collapses a command into a flag
- the **word** `budget` sits at ~50%, and it turns entirely on a question only the wisher can
  answer: is an allowance intended, or is this read-only forever?
- 🔴 and the candidate words were **not enumerated against every instance** before one was
  picked, which is what `rule.require.enumerate-before-you-name` demands. `cost`, `spend`,
  `budget`, and `ledger` were weighed against two instances, not a listed set

## .where

- `src/contract/cli/review.{meter,fleet,corpus}.ts`
- `src/domain.roles/reviewer/skills/review.{meter,fleet,corpus}.sh`
- `src/contract/cli/index.ts` (the registrations)
- `src/contract/cli/__snapshots__/reviewFleet.acceptance.test.ts.snap`
- `.agent/repo=.this/role=any/briefs/research.review-cost-and-cache.md` (cites `rhx review.meter`)
- `.log/dispatch.rubric-reuse.md` → dispatched as `ehmpathy/rhachet-roles-bhuild#398`, whose
  bar 5 cites `rhx review.meter` by name. 🔴 **a rename must amend that issue, or the bar
  names a command that no longer exists**

## .the verdict

✅ **`cost` prevails**, ruled by the wisher 2026-09-20: *"yeah, cost is better"*.

the overload argument against `budget` held. it would have put the money-spend concept onto
a word `route.guard.budget` already owns for the **round allowance**, across two commands a
driver types in one session.

⇒ the surface that survives, ruled 2026-09-21:

```
rhx review._.cost --of tree      # this tree's realized spend    (was review.meter)
rhx review._.cost --of grove     # every tree's realized spend   (was review.fleet)
rhx review._.cost --of run       # 🔴 the third breadth position, expressible for the first time
```

`review.corpus` is **deleted** under `F3`. so it is **one command over an axis**, never a set
of commands that bake an axis position into their names.

### ✅ `--of` — because `breadth` is an AXIS, and an axis position is a FLAG

`tree` and `grove` are two positions on one declared axis
(`1.vision.experience.dimensions.md`). two commands that differ **only** in one axis position
are the axis, spelled as a namespace.

⇒ and the proof it was the wrong shape: the axis has **three** positions, and the command set
expressed **two**. `run` had no surface, because a per-run figure was an artifact nobody could
ask for by name. `--of` makes it expressible with no new command.

### ✅ `_` — because `review` is a LEAF and a NAMESPACE at once

`src/contract/cli/index.ts` is the evidence, and it is unambiguous:

```ts
export const cli = {
  review,          // a leaf — `rhx review`
  reviewBy,        // 🔴 flattened to camelCase …
  reviewMeter,     //    … because `review` is already taken
  reviewCorpus,
  reviewFleet,
  route: { stone: { get, set, … } },   // a PURE namespace, so it nests cleanly
};
```

⇒ **the camelCase flat set IS the collision, already shipped.** `route` nests because no leaf
occupies `route` itself; `review` cannot, because `rhx review` is the command the whole repo
runs on.

`_` is this repo's extant marker for *"the subject itself, as a peer of its own parts"*
(`rule.require.summary-at-the-cluster-root`). applied to the cli tree: `review._` is the
command, `review.<facet>` are its facets, and the collision dissolves rather than papered over.

## 🔴 .this verdict drifted from its own argument TWICE, and the first repair caught one

the *"what was settled"* section of this file ruled **two** things. the verdict block below it
honored **neither**:

| the argument said | the verdict shipped | caught |
|---|---|---|
| `tree \| grove`, never `tree \| fleet` | `review.cost.fleet` | 2026-09-21 (`S5`) |
| 🔴 a **verb + `--of`**, never a name-baked scope — `review.budget.get --of tree` | `review.cost.tree` / `review.cost.grove` | 🔴 **later the same day, by the wisher again** |

⇒ **the first repair propagated the corrected WORD into the uncorrected SHAPE.** the driver
re-read the argument, found one contradiction, fixed it, and declared the file coherent — with
no check for whether the verdict diverged in any *other* way.

🔴 **so the lesson written that day was demonstrated again hours later, by its author.** *"a
verdict is what downstream copies"* was the conclusion; the follow-through was a re-read that
**stopped at the first defect it found**. a re-read that halts on its first hit is a sample,
not an audit — and it reports with the confidence of an audit.

## 🟡 .the verb is still owed, and is deliberately NOT settled here

the argument above demanded a verb, so the `set` slot stays open for an allowance. the ruled
shape has none: `review._.cost --of tree` reads, and can only ever read.

⇒ two ways to honor it, and this fulcrum does **not** pick between them:

- `review._.cost.get --of tree` — explicit, and long
- `review._.cost --of tree` now, with `review._.cost.set --of tree --max '$5'` later — the
  bare form reads, and the verb appears only once a second one exists

🟡 `term=review.cost` already records that an allowance, if it ships, is `review.cost.*.set`,
so the second path is consistent with the glossary. **left open rather than guessed**, because
this file has now twice shipped a verdict its own argument did not support.
