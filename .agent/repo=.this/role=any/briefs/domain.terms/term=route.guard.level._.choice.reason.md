# domain.term.choice.reason: route.guard.level

## .etymology

`level` is **inherited, never coined.** it is the word the yaml key already carries
(`RouteStoneGuard.ts` — `level?: number`), the word every extant `.guard` file declares, and the
word the wisher speaks unprompted: *"each level can specify the concurrency. (l1 is infinite, l3 is
1 at a time due to ratelimits)"*.

⇒ so this cluster does **no** word-choice work. the word was settled long before the cluster; what
was absent was its **address** — and an unaddressed term cannot be cited, boundary-qualified, or
built upon.

## 🔴 .why a mere coordinate earns a cluster of its own

the obvious objection: *a number on a ladder is generic english, and
`rule.require.domain-term-itemization` excludes generic english.*

it fails on the rule's own bar — **the anchor is a declared dobj/dop**, and `level` composes seven:

`JUDGE_LEVEL` · `getReviewLevelByIndex` · `isLevelOverruled` · `computeReviewLevels` ·
`getStoneGuardLevelState` · `isReviewLevelUnlocked` · `RouteStoneGuardReviewPeer.level`

⇒ a word that names the subject of seven declared operations is a domain term by construction. and
the sharper argument: **`term=route.guard.rung` already spends a whole section on what `level` is
NOT**, titled `.rung is not level`. a glossary that defines a term by contrast with a word it never
declares leaves the contrast half-anchored — the reader can dereference one side of it and not the
other.

## 🔴 .the occasion — an attribute was about to be hung on the wrong object

**found 2026-09-03**, in the `feat-peer-review-parallelism` vision (`1.vision` self-reviews).

that wish adds a per-gate concurrency bound, and every artifact in the round — the wish, the vision
yield, nine experience demos, fulcrum F1 — says some form of *"each **level** declares its own
concurrency."*

⚠️ **by this repo's own settled distinction, that attributes a behavior to a coordinate.** a level is
an integer. an integer holds no reviewers, spawns no subprocess, and pours at no rate. **the rung is
what has a concurrency**; the level is merely where that rung sits.

⇒ the vision had already noticed the *symptom* and filed it under `## what is awkward`:

> *"`level: 3` is an **ordinal** — a position in a sequence. `concurrency: 3` is a **cardinal** — a
> count of slots. a guard that carries `level: 3` and `concurrency: 3` on adjacent lines invites a
> reader to relate them, and they are unrelated. i have no repair for this beyond the word choice."*

**it had the observation and not the cause.** the two numbers read alike because they were about to
be written on the same object, and they describe different objects: one indexes the rung, the other
counts what the rung admits.

⇒ **that is what a glossary is for.** the vision reasoned its way to *"this feels off and i have no
repair"*; the extant `rung` cluster held the repair, and could not be found because the term it
contrasts against had no address.

## .the forbidden synonyms, and why each

| word | why forbidden |
|---|---|
| **tier** | the closest miss, and the likeliest drift — it reads as a *stratum* (a band of things) rather than a *coordinate*, so it quietly re-collapses the rung/level split this cluster exists to hold open |
| **rank** | implies an order by merit or priority. the ladder orders by **cost**, cheap-first — a level-1 reviewer is not lesser, it is cheaper |
| **depth** | inverts the metaphor. a ladder is climbed **up**; depth counts down, so `depth: 3` reads as *deeper* where the code means *higher and later* |
| **priority** | 🔴 actively wrong. a lower level runs **first**, which in most schedulers means *higher* priority — so the word inverts the very sequence it would name |

## .evidence

- **precedent** — `term=route.guard.rung._.choice._.md`, § *`.rung is not level`*. the distinction is
  declared, dated, and already carries a 2026-08-14 overload dispute. this cluster adopts it rather
  than re-derives it
- **code** — the seven declared operations above, read in the tree at `v0.33.0`
- **the wisher's own words** — archived at
  `.behavior/v2026_09_03.feat-peer-review-parallelism/.seeds/`, which is why `level` is inherited
  rather than chosen

## .disputes

_none open._

⚠️ **one is anticipated, and named here so it is not mistaken for drift.** the
`feat-peer-review-parallelism` round must settle whether a concurrency bound is declared **on the
rung** (domain-honest) or **keyed by level** (what the wisher wrote, and what the yaml shape
suggests). that is a **design fulcrum — F1 — not a term dispute**: the words are settled, and what
is open is which object carries a new attribute.

⇒ if that fulcrum lands on a shape that hangs counts off the level, **it should arrive here as a
dispute** against this cluster's *"a level is a coordinate"* claim, rather than quietly widen the
word.
