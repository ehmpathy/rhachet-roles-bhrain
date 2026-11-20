# define.invariant.review.peer.dispute.earns-no-budget

## .what

> **a dispute earns no budget and no extra review round.** only an `urgent` concession earns more
> (`define.invariant.review.peer.budget.urgent-earns-budget`, unchanged). a dispute is settled by a
> human at the gate or by a reflection, never by another paid read.

## .kind

**nurture.** the team chose it, to hold review cost against defect risk. a dispute is an argument,
not a harm, so it has no claim on the floor's extension. a different team could grant a round to
let a reviewer re-read a disputed lane. this one does not: a re-read of a lane that the driver
disputes costs money and has no verdict to give that changes passage.

## .invariant

```
dispute on concern C   ⟹  budget.granted does not change
                           no review round is triggered for the lane that raised C
budget grant           ⟹  a live urgent concession stands, a target reviewer is run dry, and
                           one stone is named
a dispute              ⟹  never a warrant for a grant
```

## .why

a dispute removes one concern from the tally. the reviewer may return next generation, so the loop
stays the correction mechanism, and the dispute buys one generation, never the stone. to add budget
for it would pay twice for the same argument: once in the driver's fulcrum, and once in a read that
the dispute was written to avoid.

⇒ the human at the gate, or the reflection upstream, settles a dispute. both are cheaper than a
read of an exhausted lane, and both can change the outcome. a free re-read of an exhausted lane
cannot: the reviewer has already said what it sees.

## .scope

- it governs the budget meter: no grant on a dispute, and no re-run on one
- it does not govern a **concession**. an `urgent` concession earns budget by its own invariant
- it is the cost twin of `never-halts-without-a-human-gate`: a dispute moves neither the clock nor
  the spend

## .the litigation

a proposal ran in the same thread as this set: let a dispute on an exhausted lane trigger one free
re-read of that lane, so the reviewer could withdraw or restate. it was withdrawn. the re-read gives
the reviewer no new evidence, since the driver's argument rides in the fulcrum and the reviewer
reads the `.taken`. an exhausted lane that re-reads returns the same count, at a cost. the
fix for a wrong reviewer is a reflection to the rubric's owner, and the fix for a dirty call is the
human's scope verdict. neither is a read.

## .the counter-argument

*"a reviewer that re-reads after a dispute might concede, and a concession would close the point at
no human cost."* stated fairly, and sometimes true. two things bound it. the reviewer's re-read
rests on the same bytes plus a `.taken` it already had the chance to read, so a changed verdict is a
sample from noise. and the human's gate verdict is final where a re-read is not: the reviewer can
re-raise the point next round.

## .what would overturn it

- a measured rate at which a re-read after a dispute flips a reviewer, with the flip cheaper than the
  human's verdict. that would argue for one capped re-read, still not for a grant
- a reviewer that reads the fulcrum itself, not only the `.taken`. a dispute would then carry new
  evidence to the reviewer, and the re-read would have a verdict to give

## .enforcement

- a dispute that adds budget or triggers a re-run of its lane = **blocker**
- a dispute cited as a warrant for `rhx route.guard.budget --add` = **blocker**
- a grant that lands with no live urgent concession = **blocker**
- enforcer: `computeBudgetGrantRefusal` refuses a grant with no warrant, and the dispute path adds
  none. it holds today (its snapshot already pins a disputed stone with every round spent). the
  clamp is a regression guard: a dispute on an exhausted lane adds no budget and triggers no re-run

## .see also

- `define.invariant.review.peer.budget.urgent-earns-budget` — the only grant, and its law
- `define.invariant.review.peer.exhausted` — what an exhausted lane unlocks, and what it owes
- `define.invariant.review.peer.dispute.never-halts-without-a-human-gate` — the clock twin
- `rule.always.spend-own-levers-before-escalation` — the budget lever and its warrant
