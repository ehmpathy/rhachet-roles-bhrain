# fulcrum F2 — the default is unbounded

**rework** — clean · **status** — 🔴 **the taken option is WITHDRAWN, 2026-09-08** · **confidence** —
n/a for `unbounded`; **82%** for the replacement

## 🔴 .the wisher retracted this fulcrum's primary evidence

seed **S3**, verbatim:

> *"ets expect that even l1 may have a bottleneck of 10 in parallel"*

this fulcrum's `for` column reads, verbatim: *the wisher said it outright: `"l1 is infinite"`*.
⇒ **that evidence is withdrawn by its own source.** the option it supported does not survive it
unchanged.

### 🔴 and the retraction reveals a THIRD option this fulcrum never priced

the fork below is **`1` or `unbounded`**. the wisher named a number that is neither.

| default | a 4-lane rung | an 8-lane rung | an 11-lane rung (#404) |
|---|---|---|---|
| `1` — serial | 1 at once — acceptance 1 **false** | 1 at once | 1 at once |
| 🔴 **`10`** ✅ | **4 at once** ✅ | **8 at once** ✅ | **10 at once, 1 queued** |
| unbounded | 4 at once ✅ | 8 at once ✅ | 🔴 **11 at once — the hazard #404 measured** |

⇒ **a default of `10` is strictly better than `unbounded` on the counter-argument and equal to it on
the argument for.** it delivers acceptance 1 for every extant guard in this repo, and it caps the
tail that #404 made concrete. **the taken option moves to `10`.**

⚠️ **this is F4's lesson in a new costume, and the third instance this round.** F4 priced an option
nobody checked was **buildable**; F2 priced two options and **never enumerated a third**.
`rule.require.enumerate-before-you-name` was written for terms and its claim is wider: *list every
instance the choice must cover, THEN pick.* **a fulcrum's option set is an enumeration too**, and
this is now the second fulcrum this round settled by an enumeration it had skipped rather than by
the judgment it recorded.

### .why 82% and not higher

- the number `10` is the wisher's, offered as an expectation (*"may have"*) rather than as a
  default. it may be the value they would **declare**, not the value they want **inferred**.
- the resource it bounds is host memory / process count, which is **global** — and under F1's
  reframe the per-group bounds are what the yaml now carries. ⇒ whether `10` is a *default group
  bound* or a *global ceil* is F1's open sub-question, not settled here.

⚠️ **confidence was lowered 88% → 78% after the radio queue was read.** issue #404 supplied measured
numbers that made the counter-argument concrete — and those numbers are exactly what makes `10`
defensible now. see below.

---

## _the record as it stood — the `unbounded` option, superseded above_

## .the fork, stated fairly

acceptance 3 requires that *"a level with no declaration behaves sensibly (state which default you
chose, and why)"*. two defaults are defensible.

| option | for | against |
|---|---|---|
| **`1` — serial** | zero behavior change for every extant guard; peak memory and brain quota stay exactly where they are; opt-in | delivers acceptance 1 for **no extant guard**. the feature ships dark until every guard is migrated, and the wish's whole complaint — *"a level of four costs the sum"* — stays true everywhere until then |
| **unbounded** ✅ | the wisher said it outright: *"l1 is infinite"*; matches `with-bottleneck`'s own `genBottleneck()` default of `concurrency: Infinity`; the win is real on day one with no migration | a behavior change for every extant guard: a level of four goes 1-at-a-time → 4-at-once, which multiplies peak memory and concurrent brain quota |

## .taken, and why at the time

**unbounded.**

the decisive argument is not preference — it is that a default of `1` makes acceptance 1 **false
for every guard that exists today**. the wish asks that *"wall clock for a level approaches its
slowest member"*; under a serial default that is true for zero levels until someone edits every
`.guard` in this repo and downstream. a feature that requires a repo-wide migration to be
observed has not been delivered; it has been staged.

and the wisher's own words settle the l1 case directly — `l1 is infinite` is a statement about the
level everyone already has, not about a level they plan to write.

## 🔴 .the counter-argument, stated fairly

the against column is real and it is the wish's own flagged hazard (*"resource pressure under full
fan-out"*). an unbounded default means the very first `--as arrived` after this ships spawns as
many brains as the level has reviewers, on a machine and a quota that were sized for one.

⇒ the answer is that this is precisely the mechanism the wish adds: **a level that cannot take the
pour declares a cap.** the feature and its safety valve ship together, which the wish insists on
(*"the two outcomes ship together or not at all"*). a serial default would ship the valve and
withhold the water.

### 🔴 the evidence that arrived — issue #404

the counter-argument asked for a measurement, and one already exists on the radio queue.
[#404](https://github.com/ehmpathy/rhachet-roles-bhrain/issues/404), filed 2026-09-02 against
`ehmpathy/rhachet`, reports a real guard run:

> `rules: files: 42 → tokens: 39.0k` · `targets: diffs since-main → files: 92` ·
> `joined via intersect → files: 75, tokens: 355.1k` · *"9 of 11 lanes ran"* ·
> `✋ prompt exceeds 75% of context window — 76.7% of 1000000 tokens`

⇒ **eleven lanes at one level, each with a ~355k-token target base.** today they run one at a
time, so exactly one such prompt is resident at once. under an unbounded default, **eleven node
subprocesses each hold a ~400k-token string simultaneously.**

⚠️ **the context window itself is NOT the shared resource** — each `rhx review` is its own process
with its own window, so concurrency does not push any single lane closer to 76.7%. what
concurrency multiplies is **host memory** and **concurrent provider quota**, by the level's member
count. #404 gives the per-lane magnitude; the multiplier is the level width.

⇒ this does not overturn the choice, and it sharpens the ask: **F2 should be ruled together with
a judgment on whether the repo's own guards want an explicit cap at their widest levels.** an
eleven-lane level is exactly the shape that should declare one.

⚠️ **what would still overturn this:** a measurement that eleven concurrent lanes exhaust memory
on a normal dev machine, or trip a provider's limit on concurrent requests. #404 gives the
per-lane size but not the concurrent peak, because concurrency does not exist yet to measure.

## .rework — clean

one default value in one place. to flip it is a one-line change plus a snapshot refresh.

## .where

- `1.vision.experience.case=3.author-declares-the-bound.md` — `## .the default, and why`
- the wish's acceptance 3 and 5

## .the verdict

_open — for the fulcrum council at the end of the route._
