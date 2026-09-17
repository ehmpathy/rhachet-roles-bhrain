# seed S4 — only the guard's author knows which reviewers share a ratelimit

**said** — 2026-09-08, by the wisher · **kind** — 🔴 **a coinage AND a reframe** — the highest-value
pair on record

## .said — verbatim, untouched

> *"yeah, lets compare and contrast our options for how to declare the concurrency group; or the
> bottleneck choice; only the author of the guard file will know which guards hit the same
> ratelimits, so only they'll know which concurrency group to cluster each reviewer in"*

## .settled — three things, and the third is the largest

### 1. the word — **`concurrency group`**

the wisher coined it. it names *a set of reviewers that contend for one resource*, and it is now the
term this feature is built around. its etymology is this sentence.

### 2. the criterion for WHERE it is declared

> *"only the author of the guard file will know … so only they'll know which concurrency group to
> cluster each reviewer in"*

⇒ **the declaration site is chosen by WHO HOLDS THE KNOWLEDGE**, never by which yaml reads
prettier. that is a harder criterion than the ergonomic one fulcrum F1 was weighed on, and it
supersedes it.

### 3. 🔴 the reframe — a bound belongs to a RATELIMIT, never to a LEVEL

**level and contention are orthogonal axes, and F1 assumed they were one.**

| axis | what it governs | what decides it |
|---|---|---|
| **level** | *order* — l1 gates l3 | the review ladder's design |
| 🔴 **concurrency group** | *contention* — who shares a ratelimit | 🔴 **which provider each reviewer calls** |

⇒ a level of 8 may hold **5 reviewers on one provider and 3 on another**. a per-level bound cannot
express that at all — it can only bound all 8 alike, which either throttles the 3 needlessly or
trips the ratelimit of the 5.

⚠️ **the wish's own example concealed this**, and honestly so: *"l1 is infinite, l3 is 1 at a time
**due to ratelimits**"* already names ratelimits as the cause — but in that example each level
happened to be one group, so **level was a serviceable proxy for group** and the two axes read as
one.

## 🔴 .the structural consequence — a bound is a property of a SET

it cannot be carried on a member. *"this reviewer has concurrency 10"* states no fact: 10 **of what
set**?

⇒ so there are **two** things to declare, never one, and F1's binary asked which single artifact
carries both:

| what | belongs where | why |
|---|---|---|
| **membership** — *which group is this reviewer in?* | 🔴 **on the reviewer** | the author knows it while they write that reviewer |
| **the bound** — *how many of that group at once?* | 🔴 **on the group** | a cardinality is a property of the set |

**F1's fork dissolves rather than resolves.** it read *"a separate map OR on each reviewer"*; the
answer is **both, and they carry different things** — the same shape as F4's dissolution by S2.

## .landed

- `.fulcrums/inventory.of=fulcrums.case=F1-where-concurrency-is-declared.md` — 🔴 **the comparison
  the wisher asked for lives here**, in the fulcrum that already owned this question
- `1.vision.yield.md` — Q1
- a `concurrency group` term cluster is owed, blocked only on its boundary

⚠️ **no new artifact was coined for the comparison.** F1 is the fulcrum for *where concurrency is
declared*, so the comparison belongs in it (`rule.always.reuse-pavement-before-improvise`). a peer
`compare.of=…` file would have been a second path beside a serviceable one.
