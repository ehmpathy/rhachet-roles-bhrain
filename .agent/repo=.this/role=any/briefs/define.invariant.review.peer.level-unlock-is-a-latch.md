# define.invariant.review.peer.level-unlock-is-a-latch

## .what

once a review level has POURED, it stays unlocked — for every later pass, whatever the levels
below it do next. the only lever that resets it is `--as rewound`.

## .kind

**nurture.** nature permits the opposite: the gate could be recomputed from scratch each pass, and
for a long while it was. we choose the latch, and the reason is the wisher's, verbatim:

> *"that way we keep the train moving, cause we know if its terminal, l3 is up regardless of what
> happens to the l1 reviews"*

⚠️ that quote is `.said` — untouched, typos and all, per `rule.always.archive-the-wishers-words-verbatim`.

## .invariant

```
level N has poured  ⟹  level N is unlocked, on every later pass
reset  ⟺  --as rewound  (at this stone, or any earlier one)
```

## 🔴 .why `poured` is not a second word for `unlocked`

the first question a reader asks — it was asked of this design on the day it was written — is
*"why even use `poured` if we have `unlocked`?"* they are not synonyms, and the difference is what
makes the latch expressible at all:

| | `unlocked` | `poured` |
|---|---|---|
| tense | **now** — may this level run this pass? | **past** — did this level ever release its reviewers? |
| kind | **derived**, recomputed every pass | **recorded**, written once, durable |
| relation | the gate's **output** | an **input** to the gate |

⇒ the gate computes `unlocked = poured OR ladderClear`. **were they one concept, that would be
circular** — a latch cannot be built out of the quantity it modifies.

### ⚠️ the trap: they are true together on the pass that matters

`canRun` (unlocked) and "a pour happened" coincide on almost every pass, so a condition written on
one reads correct under the other. **the first draft of this feature latched on `canRun` and named
the row `poured`** — the name and the recorded fact disagreed, and `poured` really was a second word
for `unlocked`, exactly as the question suspected.

⇒ the condition must be a genuine pour — `canRun && toPour.length > 0`:

```ts
if (canRun && toPour.length > 0 && !levelsPoured.has(level)) { … }
```

🟡 **and an all-cached level still stays latched**, which is the case that looks like it breaks:
it releases no lane on this pass, so it writes no row — but the pass that MINTED those caches poured
and latched then. a cache cannot exist for a level that never ran.

## .why — `terminal` is recomputed, so absent a latch it can be WITHDRAWN

the level gate reads `clearForUnlock`, derived fresh from the current verdicts on every pass. so a
lower level that reads terminal once can read non-terminal later, and the level above it is re-gated
**after it has already spoken**.

| pass | l1 | l3 |
|---|---|---|
| n | **malfunction** — terminal-for-unlock | pours ✅, rejects with real blockers |
| n+1 | the driver repairs the reviewer; it now **rejects** | 🔴 non-terminal ⟹ l3 **withdrawn** |

⇒ at n+1 the driver is mid-conversation with l3 — holds its `.given`, owes it a `.taken` — and the
lane silently disappears. **the work to answer l1 is what removes l3.**

### 🔴 a malfunction can never exhaust its way out of this

`reviewCompleted = passed || (constraint && blockers > 0)` — so a **malfunction spends no round**.
it therefore never reaches `rounds >= budget`, never enters the budget-locked skip, and re-runs on
every single pass. the exhaustion path cannot rescue this case; only a latch can.

## .enforcement

the latch is a `poured` row in `passage.jsonl`, sticky per `(stone, level)`:

```ts
// the gate — the latch is read FIRST and short-circuits
input.levelsPoured.has(input.level) ||
  input.clearance
    .filter((entry) => entry.level < input.level)
    .every((entry) => entry.clearForUnlock);
```

⚠️ **the latch only ever WIDENS the gate.** it is checked first and returns early, so it can turn a
`false` into a `true` and never the reverse. a level that has not poured falls through to the
ordinary ladder read, byte for byte as before — which is what keeps every prior clamp honest.

**both consumers of the predicate take it**, or they drift:

| consumer | why it needs the latch |
|---|---|
| `runStoneGuardReviews` | decides whether to pour |
| `getUnrunUnlockedLevels` (the judge) | 🔴 a latched level with a **queued** reviewer is a real gap. read un-latched, this judge calls the level locked, reports no gap, and the stone passes with a reviewer that never spoke — `rule.forbid.failhide` |

## 🔴 .why it rides `passage.jsonl` rather than a new store

`overruled` is **already** a level-scoped sticky marker in that ledger, cleared by exactly one lever
— a rewind, with cross-stone cascade. `poured` needs the identical semantics, so it takes the
identical shape and inherits the reset for free.

⇒ **no new file, no new gitignore, and no reset logic written** — which is why the rewind behaviour
is correct by construction rather than by a second implementation that could drift from the first
(`rule.always.reuse-pavement-before-improvise`).

## .the counter-argument

**stated fairly, because it is not weak:** if l1 was broken, is now repaired, and reports three real
blockers, should l3 spend more of its expensive budget before those are addressed? the un-latched
gate says no — and the ladder exists precisely so cheap lenses gate expensive ones.

⇒ the answer is that **l3 has already spoken.** its `.given` is on disk and the driver owes it a
`.taken`. to withdraw the lane does not recover the budget already spent; it strands a conversation
and forces the driver to re-earn a level they had already reached. the ladder's gate is for a level
that has **not yet run** — once it has, the gate's work is done.

⚠️ and the cost is bounded: the latch does not forgive l1's blockers. l1 still gates **passage**, so
the stone cannot pass until both levels are answered. the latch changes *what runs*, never *what
passes*.

## .what would overturn it

evidence that a latched level spends meaningful budget on a regression the driver could not act on —
that re-runs of a latched level are wasteful rather than informative. that would argue for a weaker
latch (hold the level open, but do not re-run it until the levels below clear again), which is a
real third option this invariant does not take.

## .the clamp

| grain | clamp |
|---|---|
| unit — the gate | `isReviewLevelUnlocked.test.ts` `[case5]` — byte-for-byte `[case3]`'s locked input plus a pour on the record, and it must read unlocked. `[t1]` pins the latch is **per level**, never stone-wide |
| unit — the judge | `getUnrunUnlockedLevels.test.ts` `[case4]` — byte-for-byte `[case2]`'s input plus a pour; `[case2]` expects `[]` and this expects `[3]` |
| acceptance — the journey | l1 malfunctions → l3 pours → l1 is repaired and rejects → **l3 still pours** |
| acceptance — the reset | after `--as rewound`, l3 is gated again |

## .see also

- `define.invariant.review.peer.level-unlock-on-budget-exhaustion` — the neighbour: exhaustion must
  read terminal on later passes. that fixes a level that never opened; this holds open one that did
- `define.invariant.review.peer.exhausted` — why the pass that spends the last round reads `rejected`
- `define.invariant.review.peer.passage` — pass ⟺ every peer guard terminal, which the latch does
  not weaken
- `term=route.guard.level.pour` — the declared verb this status is named from
