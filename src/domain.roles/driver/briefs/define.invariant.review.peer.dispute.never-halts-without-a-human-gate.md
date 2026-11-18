# define.invariant.review.peer.dispute.never-halts-without-a-human-gate

## .what

> **a dispute never halts a stone that has no human gate.** the driver records the dispute and
> drives on. autonomy and cost stay as they were before the dispute.

## .kind

**nurture.** the team chose it, to keep the drive autonomous where no human reads. a different team
could halt every dispute for a human glance. this one weighs a halt that no human is near to clear
as pure cost: the drive stalls, and the stall has no reader.

## .invariant

```
--as disputed on stone S ∧ S has no human gate  ⟹  S is not halted by the dispute
                                                    the dispute is recorded, the stone may pass
dispute.owed = human ∧ S has no human gate       ⟹  the debt is carried to the next human gate
                                                    on the route, never settled on S
```

a **human gate** is a stone whose guard demands `--as approved` (`approved?`). a stone with only
self-review and peer-review guards has none.

## .why

a halt is a summons. a summons with no human on the other end is a stall: the driver waits for a
reader who is not there. the dispute already costs the driver an argument (a `--why` fulcrum), so
the debt is recorded where a human WILL read it, at the first gate that has one
(`define.invariant.review.peer.dispute.reconciled-at-the-human-gate`).

⇒ the dispute moves the debt, never the clock. the drive keeps its pace and its cost floor.

## .scope

- it governs the **dispute path** in `route.stone.set`: record, shed the one concern from the tally,
  exit clean
- it does not govern the **human gate**, which halts on an open dispute by design (the twin
  invariant)
- a route with no human gate at all is bounded by its last stone, which refuses `--as passed` while
  an `owed: human` dispute is open (stated in the twin invariant), so autonomy never lets a dispute
  vanish

## .the litigation

the incident behind this set was a silent dispute: the human approved what the halt showed, and the
halt showed no deferral. one fix reads as "halt at every dispute, so none hides". it fails in two
ways. a halt on an ungated stone has no human to clear it, so the driver stalls or reaches for a
workaround. and the halt comes early: a dispute raised on stone 3 is read best at the gate on stone
7, where the human holds the whole diff.

⇒ so the fix is to carry, not to halt. the dispute rides as structured data to the gate, and the
gate halts. this invariant guards the carry half: the ungated stone must never become a gate by
accident.

## .the counter-argument

*"an early halt catches a wrong dispute sooner, before more work builds on it."* stated fairly, and
real: a late verdict that concedes may send the driver back over work stacked on the deferred call.
two things bound it. the dispute holds only a concern the driver judged wrong or massively dirty, so
the stacked work is rarely coupled to it. and a conceded verdict is repaired in the current diff,
never by a rewind (a rewind voids every approval at or after the rewound stone).

## .what would overturn it

- a measured case where a late verdict cost more rework than a wait at the stone would have cost.
  that would argue for a halt at some confidence band, a nurture reversal
- a route shape where most stones have no human gate and disputes pile past what one gate can read.
  that would argue for a mid-route checkpoint, never for a halt per dispute

## .enforcement

- a dispute that halts a stone with no human gate = **blocker**
- a dispute path that exits non-zero on a clean record = **blocker**
- a dispute path that omits the record (the fulcrum link, the `owed` carry) in order to stay silent =
  **blocker**
- enforcer: the dispute path in `route.stone.set` (`setStoneAsConcernAbsorbed.ts`) records the
  dispute and never halts. it holds today. the clamp is a regression guard: a stone with no human
  gate and a dispute at 70% passes with no halt, and the clamp goes red when a halt is added

## .see also

- `define.invariant.review.peer.dispute.reconciled-at-the-human-gate` — where the carried debt lands
- `define.invariant.review.peer.dispute.earns-no-budget` — the cost half of the same autonomy
- `define.invariant.review.peer.absorption.disputable-regardless-of-verdict` — what may be disputed
- `rule.always.drive-autonomously` — the posture this guards
