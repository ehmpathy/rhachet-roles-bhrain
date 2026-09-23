# F15 · the halt's `yours to spend` label cannot read the gate's predicate where it stands

- **rework** = 🟡 clean, and larger than this board's peers · **confidence** = 🔴 **58%** ·
  **status** = best-guessed · **triage** = 🔴 `[wisher]` — a render-purity call

## .why this row exists at all

**the vision priced this at zero, twice.** § *the aha* and `dimensions.md` §4 both require the halt
to stop advertising a refusal, and no artifact asked what that costs. `r5` opened the renderer and
found a signature that refuses the obvious shape.

## .the constraint, read from source

```ts
export const computeBlockRemedyGroups = (input: {
  stone: string;
  passage: 'allowed' | 'overruled' | 'blocked' | 'malfunction';
  reason: string;
}): BlockRemedyGroup[] => {          // 🔴 synchronous
```

`formatBlockRemedyGroups.ts:62-66`, and `:97` is the single source of
`increase budget — yours to spend`.

| the gate's predicate needs | the renderer has |
|---|---|
| `route` | 🔴 **absent** |
| `stone` | ✅ present |
| an `await` — `getStoneLiveUrgentConcessionSlugs` reads the review corpus off disk | 🔴 **sync** |

⇒ **the label cannot consult the predicate where it stands.** that is a fact, not a fork; the fork is
what to do about it.

## .the fork

| option | the shape | the cost |
|---|---|---|
| A | thread `route` in and make the operation **async** | an `await` at every caller, and ~15 tests in `formatBlockRemedyGroups.test.ts` become async. 🔴 it also makes a **pure renderer do disk i/o** |
| 🔴 B | compute the predicate **upstream**, pass one boolean field | one added input; ripples to callers and fixtures. **the renderer stays pure** |
| C | leave the label **unconditional** | zero code — and it inherits the defect `dimensions.md` §4 names |

## .taken, and why

🔴 **option B.**

1. **it keeps the render pure**, which is the property `rule.forbid.decode-friction-in-orchestrators`
   and `define.domain-operation-grains` both protect — a transformer computes, a communicator commutes.
   option A makes a transformer read disk
2. **the caller already holds the route.** every site that renders a halt resolved a route to get
   there, so the predicate is one `await` upstream where an `await` already lives
3. **option C is the pit-of-failure stated as a design.** `dimensions.md` §4 measured it across 5
   halt kinds and found **4 of 5 advertise a refusal** — to ship the gate and leave that is to make
   the engine print a command it will then reject

## .rework, and why

🟡 **clean, and larger than this board's other rows.** every peer here is a predicate or a copy
change; this is a **signature** change with a test-fixture tail. it is still clean — no caller is
hardened against the shape, and a reversal is a field removal.

⚠️ **the tail is the part that is not sized.** `formatBlockRemedyGroups.test.ts` carries ~15
assertions of the label and `formatRouteDriveHalts.test.ts` ~10; both counts are **ceilings** taken
from a grep, never a read. ⇒ the shape of the cost is certain; the magnitude is not.

## .confidence, and why it is 58%

| what is certain | what is not |
|---|---|
| ✅ the renderer cannot reach the predicate — read from the signature | 🔴 whether a council prefers purity (B) or fewer touched files (A) |
| ✅ option C inherits a measured defect | 🔴 whether §4's defect is **in scope** for this wish at all — it predates it |

🔴 **the 42%:** a council may rule that §4's *"advertises a refusal"* is an **extant** defect and that
this behavior should not grow a signature change to fix it — which makes **C** correct and this row
moot. that argument is real: the wish's eight requirements never mention the halt copy, and
`rule.always.fix-forward-under-scouts-honor`'s CLEAN question is genuinely arguable here.

⇒ **what would settle it:** a wisher's call on whether the halt copy is in this wish's scope.

## .where

`formatBlockRemedyGroups.ts:62-66` — the signature · `:97` — the label ·
`getStoneLiveUrgentConcessionSlugs.ts:19-39` — the async predicate ·
`1.vision.experience.dimensions.md` §4 — the 4-of-5 measurement ·
`1.vision.yield.md` § *the change surface* — the row this fulcrum bounds

## 🔴 .the verdict — DISSOLVED at 5.1.execution, 2026-09-18. no council was owed

**the fork had a false premise, and the source refutes it.** this row read *"the renderer cannot
reach the predicate"* and priced three options against that. it does not need to reach the predicate
at all — **the severity already travels in its own input.**

`genRouteGuardExhaustedReason` writes one of two disjoint prefix marks ahead of the
`budget exhausted:` colon, and `asConcessionReasonDisplay` already parses them. so `input.reason`
carries the halt kind the label must branch on, and it always did:

| halt kind | the mark in `input.reason` | the driver's lever |
|---|---|---|
| urgent concession | `an urgent concession earned a round` | `increase budget — yours to spend` — unchanged |
| better concession | `concessions await the round that confirms them` | `fix what you conceded — yours to run` |
| no concession | no mark | `converge with the reviewer — yours to run` |

⇒ **no `route` threaded, no `await`, no boolean field.** option A's purity cost and option B's
signature change were both prices for a capability the operation already had.

🟡 **so the `.rework` estimate was wrong in the SAFE direction** — it graded this *"larger than this
board's peers, a signature change with a test-fixture tail"*, and the landed change touched no
signature at all. the ~15 + ~10 label assertions did move, but as copy rather than as async rewrites.

🔴 **and the 42% doubt was aimed at the right question and answered the wrong way.** it asked whether
§4's *"advertises a refusal"* defect is in this wish's scope, and reasoned that a signature change
might not be worth it. **with the cost at zero, the scope question loses its force** — a gate that
ships beside a halt which prints the command it will reject is a pit of failure the wish's req 5
(*the refusal names the sanctioned move*) is already aimed at.

⇒ the class, and it is the third time on this route: **an artifact priced a fork before it read the
inputs the operation already holds.** the instrument that caught it was the same one that caught
`F09` and `F06` — a source read of what the row asserts, rather than a re-argument of the row.

⇒ landed: `1.vision.yield.md`'s § *the change surface* row for `formatBlockRemedyGroups.ts:97` ·
`5.1.execution.from_vision.yield.md` § *the log*, `F15 DISSOLVED`.
