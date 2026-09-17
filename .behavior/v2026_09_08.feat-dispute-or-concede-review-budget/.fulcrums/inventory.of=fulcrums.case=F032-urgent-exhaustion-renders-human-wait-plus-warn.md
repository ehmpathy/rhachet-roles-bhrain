# F32 · an URGENT concession exhaustion renders human-wait + warn — the requested flip contradicts S12/S14

- **rework** = clean · **confidence** = 90% · **status** = disputed (behavior-intent-coverage blocker.1, r008 i004)
- **raised 2026-09-14**, mid-execution at stone `5.1.execution.from_vision`, in answer to a peer blocker

## .the concern

behavior-intent-coverage blocker.1 (i004) asks that the render, disposition, and onStop treat an
**urgent** concession exhaustion the way they treat a **better** one — a flip to the driver's-own
concession words that also BLOCKS the stop, so the driver self-drives a top-up. it reads the two
marks as if they should be OR'd (`isConcession = isRouteGuardConcessionExhaustion || isUrgent`).

## .taken, and why — DISPUTE

the concern rests on a premise the current tree does not hold, and the change it requests
**contradicts a wisher ruling** (S12/S14, `define.invariant.review.peer.budget.urgent-earns-budget`).

the current tree keeps the two marks **disjoint**, and all three surfaces agree for urgent —
**halt(exhausted) · allow the stop · render human-wait + warn**:

1. the render — `isConcession` is BETTER-only, `isUrgent` is a separate mark, never OR'd
   (`formatRouteDriveBudgetExhausted.ts:98,108`); an urgent row takes the human-wait branch on the
   header, reason, "what to do" head, and tail, and the warn rides on top additively (`:133`)
2. the disposition — urgent maps to `halt(exhausted)` (`asRouteStoneDisposition.ts:53`), a human wait
3. onStop — the `halt(exhausted)` branch ALLOWS the stop (`stepRouteDrive.ts:304`); the better-only
   block at `:322` deliberately does NOT catch urgent, and the comment at `:314-318` names this review

## .the design law it protects

| the concession | the lever | the stop |
|---|---|---|
| **better** | the driver's own — `--add N --peer` | BLOCK, self-drive |
| **urgent** | a HUMAN's grant (`F029`/`S14`) | ALLOW, and warn the human |

⇒ to block the stop on urgent would strand the driver against a lever they do not hold, and spin to
the 21-block malfunction cutoff. the vision's S12 table fixes it: `none → halt/allow`,
`better → push/block`, `urgent → halt/allow + warn`. the tree matches the table.

## .why DISPUTE, not concede

the requested change is not a repair — it is a reversal of S12/S14. a concede would commit me to
make the code do the opposite of what the wisher ruled. the honest stance is that the concern's
requested flip is refused on the ground of a wisher ruling, and the current render is the correct
end state the concern itself describes (`urgent ⇒ human-wait + warn`).

## .rework — clean

no edit is owed — the tree already renders urgent as human-wait + warn. to reverse is to delete this
row. (were the council to side with the concern, the change would touch three surfaces plus a snapshot
suite — but that would also demand an overturn of S12/S14, so the dirt lives in the verdict, not here.)

## .confidence — 90%

all three surfaces are read end to end and cross-checked against the S12 table and
`define.invariant.review.peer.budget.urgent-earns-budget`. what keeps it below 100%: the urgent
auto-grant is deferred (`F029`), so a council that wants the engine to self-buy an urgent round would
reopen this — but that is the deferred dream, not this PR's scope.

## .where

`src/domain.operations/route/drive/formatRouteDriveBudgetExhausted.ts:98,108,120,133,169` ·
`src/domain.operations/route/drive/asRouteStoneDisposition.ts:49,53` ·
`src/domain.operations/route/stepRouteDrive.ts:304,314-318,322` ·
`define.invariant.review.peer.budget.urgent-earns-budget` · `F028` · `F029`

## .what would settle it

a council read of the S12 table against the three surfaces, plus a verdict on whether the deferred
urgent auto-grant (`F029`) should land in this PR — which is the only change that would flip the
urgent branch to driver-owned.

## .the verdict once ruled

_unruled — disputed at 90%, the council rules._
