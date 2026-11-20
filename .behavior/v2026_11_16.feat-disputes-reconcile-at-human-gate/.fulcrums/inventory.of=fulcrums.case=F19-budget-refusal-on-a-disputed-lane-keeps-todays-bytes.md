---
case: F19
rework: clean
ground: wrong
confidence: 0.75
status: open
owed: none
holds: []
lean: the budget refusal on a lane that carries a dispute keeps today's bytes; the doors that settle a dispute live on the approval halt and the dispute's own stdout
verdict: null
---

# F19 — the budget refusal on a disputed lane keeps today's bytes

## .the fork

vision case=6 `[t1]` sketched a new branch on the budget refusal: where the target lane carries a
dispute, the refusal adds the doors that settle it, read from the fulcrum's ground.

- A: keep the refusal as is; it already refuses (no live urgent concession), and the doors render
  where a dispute is recorded and at every human gate
- B: build the branch: the meter reads the passage log for disputes on the lane and renders the
  doors by ground

## .taken, why

A. invariant 6 — a dispute buys no budget — holds by the extant refusal, and its clamp
(`formatBudgetGrantRefusalLines.test.ts`) goes red if a dispute is wired in as a warrant. the
doors are a hint, not a guard: the dispute's stdout already names them at the moment of the
dispute, and the approval halt lists the dispute with its rule command. B adds a passage read to
the meter for a line a driver has already seen.

## .rework, why

clean. B is one read of the passage log inside the refusal formatter, one branch of lines, and a
snapshot. no caller depends on the refusal's current shape.

## .confidence, why

the vision sketched B as `(new)`, so the call drops a sketched line. 75%.

## .where

`src/domain.operations/route/guard/review/peer/meter/formatBudgetGrantRefusalLines.ts` (the refusal) · vision `case=6 [t1]`.

## .verdict

open. a design call; owes no dispute. the human may ask for B at the gate.
