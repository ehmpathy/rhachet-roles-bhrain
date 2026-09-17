# S12 · the concession halt fires once every level is terminal, and it is the driver's

- **caught** = 2026-09-13
- **axis** = the halt's scope, and its owner

## .said

verbatim, across four messages:

> and is it clear that only if they conceded and only once they reach the end of all the levels of
> review should the reviewed? judge say 'halted on more budget, to address concessions'

> i.e., if concessions were only on l1, then it shouldn't block l3

> l3 should still run before a human's intervention is required

> this seed should be enstilled in the vision and execution if not already there
>
> unless the vision already proposes something even more autonomous

## .settled

**two claims, and they land differently.**

### 1. the LEVEL scope is already structural — no change owed

the exhaustion halt is gated on `allTerminal` (`setStoneAsPassed.ts:575-579`), and `exhausted` is
terminal-for-**unlock** (`getStoneGuardLevelClearance.ts:73-74`). so:

| the ladder state | what happens |
|---|---|
| l1 conceded + exhausted, l3 unrun | l1 is terminal → **l3 unlocks and RUNS**. `allTerminal` false → no halt |
| l1 conceded + exhausted, l3 rejected with budget left | `allTerminal` false → **no halt**. an ordinary push to the judge |
| l1 conceded + exhausted, l3 terminal | `allTerminal` true → the halt fires, and only now |

⇒ **a concession on l1 cannot hold l3 from a run.** the ladder already enforces it, and the
enforcement is one predicate rather than a convention.

### 2. the halt's WORDS and its OWNER are a real gap

the halt persists `status: 'exhausted'`, and `asRouteStoneDisposition.ts:22` maps that to
`{ of: 'halt', why: 'exhausted' }` **unconditionally** — a human wait.

⇒ so a driver that **conceded**, exhausted, and reached `allTerminal` is handed a human halt whose
remedy is **its own lever**. that is exactly the adjacency
`rule.always.spend-own-levers-before-escalation` measures:

> *"two remedies rendered side by side with no owner column read as two human remedies, and the
> driver's own lever is the one that gets surfaced upward."*

**the repair, in the wisher's own words:** the halt says *"halted on more budget, to address
concessions"* — it names the **concessions** as the reason and the **top-up** as the remedy, and it
is the driver's to run.

🔴 **and the CONDITION is a conjunction, never one clause.** all three must hold:

1. every level is terminal (`allTerminal`)
2. a lane was skipped for exhaustion
3. 🔴 **a concession stands against the current generation** — without this, an exhausted lane the
   driver never conceded is an ordinary human wait, and a concession-worded halt would lie

## .the vision proposes NAUGHT more autonomous — the seed extends it

the vision's most autonomous claim is `case=6` `[t1]`: the **ack** after `--as conceded` prints the
top-up and names no human. that is a strictly **narrower surface**:

| surface | who owns it, before this seed |
|---|---|
| the ack at `--as conceded` | ✅ the **driver** — `case=6` `[t1]`, already in the vision |
| the exhaustion halt at `--as passed` | 🔴 a **human** — unconditional, and the gap this seed closes |

⇒ **a driver reads the ack once and the halt on every re-arrival**, so the surface the vision left
human-owned is the one the driver meets more often.

## .landed

- `1.vision.yield.md` — § *the code surfaces that must move*
- `5.1.execution.from_vision.yield.md` — phase 6
- `src/domain.operations/route/guard/review/peer/genRouteGuardExhaustedReason.ts` — the mark
- `src/domain.operations/route/guard/review/peer/getStoneConcededLaneSlugs.ts` — the third clause
- `src/domain.operations/route/stones/setStoneAsPassed.ts` — the exhaustion halt's reason
- `src/domain.operations/route/drive/asRouteStoneDisposition.ts` — `push`, never `halt(exhausted)`
- `src/domain.operations/route/drive/formatRouteDriveBudgetExhausted.ts` — the words
- `src/domain.operations/route/guard/tree/formatBlockRemedyGroups.ts` — the suppressed approval tail
- `src/domain.operations/route/stepRouteDrive.ts` — onBoot · onStop · direct
