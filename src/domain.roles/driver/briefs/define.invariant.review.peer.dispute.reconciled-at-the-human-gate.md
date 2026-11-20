# define.invariant.review.peer.dispute.reconciled-at-the-human-gate

## .what

> **at a human gate, every dispute that owes a human is reconciled with that human before approval.**
> the approval halt names each one, and `--as approved` (and `--as forced`) is refused until the
> human has a verdict on each: upheld, or conceded with the driver sent to fix.

## .kind

**nurture.** the team chose it, after an incident where a human approved what the halt showed and
the halt showed no deferral. the gate is the one place a human reads with the full diff in hand, so
the team parks every owed dispute there. a different team could settle disputes by a council, or by
none.

## .invariant

```
S is a human gate
  ∧ ∃ fulcrum F on the route · F.owed = human ∧ F.verdict = null
    ⟹  the halt lists F                    (case · concerns held · confidence · lean)
    ⟹  --as approved and --as forced on S are refused until F.verdict is a human verdict

F is unreadable (no valid frontmatter)
    ⟹  the halt lists F as `unreadable, owes repair`; approval is refused until F reads

S is the last stone of a route with no human gate
  ∧ ∃ F · F.owed = human ∧ F.verdict = null
    ⟹  --as passed on S is refused, and names the human who must rule

F.verdict = conceded
    ⟹  the stone is not re-held by the tally; the human withholds approval until the repair lands
```

🔴 **one render, three surfaces.** the dispute lines come from one formatter, shared by the drive
halt (`formatRouteDriveNeedsApproval`), the judge (`judgeApproved`), and the approval refusal. the
refusal carries the full lines, never only the case ids: the drive halt is read by the driver, and
the refusal is the surface the human surely reads.

## .why

the incident: a rules lane raised a class of name defects; the driver disputed them onto one held
fulcrum, a table of rows at 55 to 90 percent confidence; the stone passed its review tally. at the
approval gate the halt showed no deferral. the human read the blueprint, found three name defects by
hand, and two of them sat in the held table.

⇒ the fix is not to make the human read more. it is to make the halt show what was left to the human.
the same halt, with two more lines, would have pointed the human at the table.

the halt derives its lines from frontmatter, never from the driver's prose, so a driver cannot omit
one by omission or by a soft word. an unreadable fulcrum is listed, never skipped: a silent skip is
the incident rebuilt.

## .scope

- it governs disputes with `owed: human`: every dispute under 0.90 confidence, and every dispute on
  the dirty ground at any confidence (the twin `sure-misread-owes-a-reflection`)
- it reads every open debt on the route, not only the debt raised on this stone: a dispute raised on
  stone 3 lands at the gate on stone 7
- a reflect-owed dispute shows on the halt apart, as information. it never blocks approval
- it does not decide the verdict. the human does, through the human-only lever
  `rhx route.fulcrum.rule --case <id> --as <upheld|conceded>`
- a conceded verdict on a stone already passed is repaired in the current diff. a rewind of the old
  stone would void every approval at or after it, the gate the human is at included

## .the litigation

three forks settled the shape.

- **the lever.** a verdict is about a fulcrum, which can hold concerns across lanes and ride across
  stones, so the lever is a skill over the fulcrum, never a new `--as` value on a stone. `conceded`
  already means the driver's concession on `route.stone.set`, so a human `--as conceded` on a stone
  verb would read two ways. a hand edit of the yaml cannot tell a human from a driver, so the lever
  is the one writer, and the verdict carries provenance (`the-fulcrum-is-the-one-home`)
- **the debt crosses stones.** the dispute is carried "to the next gate on the route", and a read of
  this stone alone would break that sentence. so the halt reads every open debt on the route
- **the gateless route.** a route with no human gate would discharge the debt by its shape alone. so
  the last stone refuses to pass while the debt is open. the alternative keeps full autonomy and
  rebuilds the incident's silence by another path
- **forced is no side door.** `forced` is approve plus overrule (`setStoneAsForced.ts`), so it takes
  the same refusal

a conceded verdict does not restore the concern to the tally. the dispute already shed it, and the
human who conceded is the human who approves. a mechanism for a second hold would duplicate the
approval the human already owns.

## .the counter-argument

*"a gate that lists every dispute makes the human read more, and a long list is skimmed."* stated
fairly, and real: a late gate on a long route may list many lines, and a human may uphold all in a
reflex. two things bound it. a verdict is one command per dispute, with no uphold-all form, so each
call is a deliberate act. and the line is short by design: case, concerns held, confidence, lean. the
human reads a table of leans, not the driver's prose.

## .what would overturn it

- a measured case where the lines were skimmed and a defect still shipped. that would argue for a
  council or a sample read, never for a silent gate
- a gate that is not a human (a trusted automated approver). the human-only check
  (`getDecisionIsCallerHuman`) would then move, and the reconcile with it

## .enforcement

- an approval or a force that goes through with an `owed: human` fulcrum whose `verdict` is null =
  **blocker**
- a halt that omits an open `owed: human` fulcrum, or that renders its lines apart from the shared
  formatter = **blocker**
- an unreadable held fulcrum skipped by the halt, the judge, or the refusal = **blocker**
- a route with no human gate whose last stone passes with an open `owed: human` dispute = **blocker**
- a refusal that names case ids and withholds the lines = **blocker**
- a human-gated stone that passes with an open `owed: human` dispute raised after its approval =
  **blocker**. the gate a human opened does not wave a later dispute through: the approval falls
  out of force until a human rules it, so the `approved?` judge halts and the drive shows the
  human what to rule (`isStoneApprovalInForce`, read by `getOneStoneGuardApproval`)
- enforcer: the approval refusal on `--as approved` and `--as forced` (`setStoneAsApproved.ts`,
  `setStoneAsForced.ts`), which reads the fulcrum frontmatter (`owed: human`, `verdict: null`). the
  clamp: a human gate with a dispute at 70% halts, names it, and refuses approval until ruled; with
  the enforcer reverted, the halt is silent and approval goes through

## .see also

- `define.invariant.review.peer.dispute.never-halts-without-a-human-gate` — why the carry, not a halt
- `define.invariant.review.peer.dispute.sure-misread-owes-a-reflection` — what owes a human, by band
- `define.invariant.review.peer.dispute.deferrals-accrue-where-the-human-reads` — the same halt, by
  its rule pair
- `define.invariant.review.peer.dispute.the-fulcrum-is-the-one-home` — the frontmatter the halt reads
- `define.invariant.review.peer.passage` — approval is permission, passage is action
- `rule.require.deferrals-accrue-in-the-blocker-list` · `rule.forbid.deferrals-hidden-from-the-human`
