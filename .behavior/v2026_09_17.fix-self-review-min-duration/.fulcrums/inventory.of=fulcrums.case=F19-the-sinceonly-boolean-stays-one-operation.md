# F19 — the `sinceOnly` boolean stays one operation, after a split was tried and reverted

- **raised** = 2026-09-19, i009, lane `arch-opport-decomposition`, **re-raised at i010 and i011 (D2)**
- **rework** = clean
- **status** = OPEN — deferred this round, with a dream
- **confidence** = 80%

## .the fork, stated fairly

`setSelfReviewTriggeredReport({ sinceOnly })` takes a boolean that selects between two **disjoint**
operations: mint the `.since` marker for a fresh ask, or stamp the `.uptil` marker for a claimed
adjudication. the two share a path prefix and share no other line.

| option | the claim |
|---|---|
| **A** — two named exports | `rule.require.fewer-paths-via-idempotency` and the round's own thesis: a flag that picks between two returns is a bifurcation, and a bifurcation hides two operations under one name |
| ✅ **B** — keep the boolean, catch a dream | the split is a pure rename with **zero** behavior change, measured at ~32 edits across 8 files, inside a round that already carries four independent repairs to one gate |

## .taken, and why AT THE TIME

**B** — and the measurement is the reason rather than a hunch. 🔴 **the split was not merely
estimated. it was ATTEMPTED at i009, measured, and reverted:**

- two named exports (`setSelfReviewAskedAt`, `setSelfReviewAdjudicatedAt` in the draft)
- **~32 edits across 8 files** — 3 production call sites, 5 test files
- **zero** behavior change, zero contract change at the cli, zero snapshot movement

⇒ `rule.always.fix-forward-under-scouts-honor` grades the pair SAFE/CLEAN, and the **CLEAN** half is
what fails: a rename that opens 8 files ripples past the diff this round has, and the mirror clause
of that same rule — *"a large cleanup smuggled into an unrelated change"* — grades it a blocker from
the other side.

## 🔴 .the re-raise is the strongest operand against this entry

the lane at i011 put it plainly: *"flagged independently by 3 different review lanes across 3 rounds
and deferred each time. recurrence this consistent usually means the abstraction boundary is wrong,
not just untidy."*

**the inference is conceded. the premise is not.**

| the lane's premise | the record |
|---|---|
| *"deferred each time"* | i009 **attempted** it, measured 32 edits across 8 files, and reverted. the two later rounds deferred against that measurement rather than against a shrug |

⇒ so what the record now holds that it did not at i009 is a **number**, and the number is what a
council rules against. the next lane to raise this inherits the measurement rather than a
re-derivation of it.

🟡 **and the deferral gets weaker with each round it survives**, by the lane's own argument — a
recurrence is evidence about the argument, never merely about the item. that is stated here rather
than answered, because it is correct.

## .rework, and why

**clean.** a pure rename. no caller's behavior changes, no contract at the cli moves, no snapshot
shifts. a council that rules **A** gets a substitution across 8 files, mechanically.

## .confidence, and why it is not higher — 80%

1. **the cost is real and it is small.** 32 edits is a measurement, and a measurement that reads
   *"too many"* in one round reads *"trivial"* in a round with a smaller diff. the deferral is a
   **scope** call, so it expires when the scope does
2. **three lanes agree, and the drive does not have a counter-argument on the merits.** the entry
   answers *"is the boundary wrong?"* with *"yes"* and defers anyway. an appeal to scope is a
   legitimate reason to defer and a poor reason to believe one is right

## .where

- the dream: `.dream/v2026_09_19.fix.a-sinceonly-boolean-bifurcates-two-disjoint-operations.md`
- the operation: `src/domain.operations/route/guard/review/self/setSelfReviewTriggeredReport.ts`
- the rule the lane cites: `rule.require.fewer-paths-via-idempotency` (ehmpathy/architect)
- the rule that grades the deferral: `rule.always.fix-forward-under-scouts-honor` — **both** clauses

## .the verdict, once ruled

— not yet ruled.
