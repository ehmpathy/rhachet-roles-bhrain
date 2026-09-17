# F17 — the two new advisories write past the injected sink

- **raised**: 2026-09-13, at i011, by peer lane `enroll-impl-arch-defects` (blocker.3)
- **rework**: **clean** — a channel swap, no behavior moves
- **status**: open
- **confidence**: **88%**

## .the call

this feature adds two advisories the author reads, and both call the global `console.error` directly:

```
runStoneGuardReviews.ts   the concurrency-group-leak advisory   (option G, landed 2026-09-13)
runStoneGuardReviews.ts   the level-pour announce
```

**taken: leave them on `console.error`.** the aim behind the objection — one governed output contract
— is accepted, and it is deferred as a contract change to a shared object rather than refused.

## 🔴 .the reviewer's premise is false, and the taken does not rest on that

> *"these are the **only two** `console.error` calls in the entire domain-operations subtree"*

| file | calls |
|---|---|
| `src/domain.operations/review/stepReview.ts` | ~50 |
| `src/domain.operations/route/stepRouteStatusLine.ts` | 1 |
| `src/domain.operations/route/guard/runStoneGuardReviews.ts` | the 2 under review |

⇒ ~60 in that subtree. **`console.error` is the extant pattern this feature conformed to**, never an
inconsistency it introduced.

⚠️ **but a false premise is not an argument, and the conclusion could still hold.** *"the repo already
does it"* is precedent rather than a reason (`rule.always.reuse-pavement-before-improvise`: precedent
is a reason to look, never a reason to conform). the real ground is the stream split below.

## 🔴 .the stream split is what makes the naive fix unaffordable

| stream | carries | who observes it |
|---|---|---|
| **stderr** — `console.error` | the leak advisory, the pour announce | a human, live |
| **stdout** — the `ContextCliEmit` sink | the settled guard tree | 🔴 **36 frozen snapshot oracles** |

⇒ `ContextCliEmit` is handed the stdout writer at `route.ts`. to route an advisory through it puts
that line **on stdout**, where every one of those oracles reads. the wish's acceptance 2 asks that the
settled tree survive this feature byte-for-byte, so the naive fix rewrites 36 oracles to carry lines
the vision never drew — and each rewrite is a lost check rather than churn.

## .the options, enumerated before the pick

| # | option | what it buys | what it costs | verdict |
|---|---|---|---|---|
| **A** | leave both on `console.error` | zero diff · zero oracle movement · matches ~60 extant calls | the file has two answers to *"what can this print"* · the `[t5]` clamp stays a string match | ✅ **taken** |
| **B** | an `onGuardAdvisory` hook on `ContextCliEmit`, with its own **stderr** sink | a typed event · a structured `[t5]` clamp · one governed contract | a contract change to a shared domain object · every construction site updated · a new sink slot | 🟡 **the right long shape** — deferred |
| C | reuse `onGuardProgress` with a new event shape | no new hook | 🔴 overloads one event with two concepts (`rule.forbid.domain-term-ambiguity`) · every consumer must now discriminate | ❌ |
| D | route through the extant `cliEmit` path as-is | one-line diff | 🔴 **puts advisories on stdout** ⇒ 36 oracles move, acceptance 2 breaks | ❌ **not defensible** |
| E | a standalone injected `emitAdvisory`, off `ContextCliEmit` | testable, no shared-object change | a second injection channel beside the one that exists — the exact scope leak the objection names | ❌ |

🔴 **D is the option the blocker's own prose prescribes**, and it is the one that is not defensible.
the objection is right about the aim and its named fix is the arm that breaks acceptance 2.

## .why A rather than B, in this round

1. **B's rework is dirty.** `ContextCliEmit` is a shared domain object; a new hook touches its type,
   its construction sites, and every fake a test builds. that is a ripple past the diff this stone
   opened (`rule.always.fix-forward-under-scouts-honor`: safe ✅, clean 🔴)
2. **the cost A carries is a testability cost, and it is already paid.** the `[t5]` clamp exists and
   bites — cut the emit and exactly one clamp goes red, measured 2026-09-13. B would make that
   assertion nicer; it would not make it possible where it is now impossible
3. **A is reversible at any time.** the two call sites are two lines

## .what would overturn it

**a measurement, not a preference:** a third advisory lands in this file. two call sites is a pattern
a reader can hold; three is a channel, and a channel wants a contract. ⇒ **the trigger is the third
one**, and it is checkable by a grep rather than by a judgment.

⚠️ also overturned if `ContextCliEmit` gains an advisory hook for an unrelated reason — then B's cost
is already sunk and A is no longer the cheap arm.

## .why the confidence stops at 88%

the **stream** argument is solid and measured. what is unmeasured is whether B's stderr sink would
genuinely leave the oracles alone in practice — that rests on a read of how `route.ts` wires the sink
rather than on a run. ⇒ a traveler who takes B owes that verification first, and it is the one input
this row does not hold.

## .the record

- the blocker: `…r011._.given.by_peer.enroll-impl-arch-defects.md`, blocker.3
- the answer: `…r011._.taken.by_self.enroll-impl-arch-defects.md`
- the landed advisory this concerns: **F13 option G**, 2026-09-13
