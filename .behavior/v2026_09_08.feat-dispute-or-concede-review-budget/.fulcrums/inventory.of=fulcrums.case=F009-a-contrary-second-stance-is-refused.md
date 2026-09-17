# F09 · a contrary second stance on one given is refused

- **rework** = clean · **confidence** = 72% · **status** = best-guessed

## .the fork

acceptance #1: *"a driver's response carries exactly one of `<dispute>` or `<concede>`. **neither,
or both**, is refused."*

with two separate commands (F02), *"both"* cannot occur in one invocation. it can occur in
**sequence**: `--as disputed --with architect`, then `--as conceded --with architect`.

| option | the second, contrary declaration |
|---|---|
| **A** | **refused** — one given, one stance |
| **B** | the latest wins — a driver may change its mind freely |
| **C** | refused only after the drive has already moved past the stone |

## .taken, and why

**option A.**

- **acceptance #1 says *"both is refused"*, and B makes *"both"* reachable** — just spread across
  two keystrokes. an acceptance criterion a sequence defeats was never enforced.
- **a stance is a record, and a record that flips records no claim.** the council reads
  `passage.jsonl`; a lane that reads `disputed → conceded → disputed` says naught.
- 🔴 **B re-opens the escape.** dispute to lift the hold, drive on, concede to look diligent — both
  on record, neither costly. that is the *"empty `.taken`"* hole
  (`rule.forbid.unanswered-exits-from-a-blocker`) with a new door.

**an identical repeat is idempotent**, per `rule.require.idempotent-operations`. only a **contrary**
second stance is refused.

## .the escape that keeps it survivable

a driver that genuinely changes its mind is not stuck: **a stance is keyed to the given, and a new
round mints a new given.** so

1. concede, fix, re-arrive → the lane runs → a new given lands
2. that given carries its own stance slot, still open

⇒ **within one given the stance is final; across givens it is free.** the bound sits on the flip,
never on the mind.

⚠️ **the asymmetric case is a `disputed` lane**, which under F04 never runs again on that stone — so
it mints no new given, and the dispute is final for the stone. **that is F04's cost, surfaced here
too**: a driver who disputes then regrets it has one exit, the human overrule.

### ✅ and that one exit was traced — it works, for a reason worth the record

`rewindAffectedStones.ts` calls `delStoneGuardArtifacts`, which **deletes the givens**, then resets
the peer meters to a fresh budget. ⇒ the stance has no referent afterward and voids by construction,
so the human exit is real rather than assumed. ✅ **this entry's `.rework` line already keys the
check to `(stone, slug, given)`, and that key is what makes the exit work** — a `(stone, slug)` key
would survive the rewind and strand the lane.

🔴 **what the rewind does NOT clear is this entry's own artifact class.** `passage.jsonl` is
append-only and the operation performs no `.fulcrums/` cleanup, so a rewound dispute leaves a live
fulcrum entry — which `case=8` `[t0]`'s *"findsert, never insert"* will then **find**, and a fresh
post-rewind dispute inherits the stale rationale.

⚠️ **it does not move this confidence.** F09 asks whether the **driver** may revoke; this is about
what the **human's** revoke leaves behind. ⇒ the two candidate repairs are in the yield's
pit-of-success table, and either one keeps this escape intact.

## .rework, and why

**clean.** the check is a read of the latest stance for `(stone, slug, given)` before the write —
the same shape the contemplation gate already uses.

## .confidence, and why it is 72%

the reasons are good and the mechanism is cheap. the 28% is the escape above: **a driver that
disputes in error has no unilateral undo**, and the *"across givens it is free"* argument is one I
invented rather than found in the wish.

⇒ **what would settle it:** whether the wisher wants `--as disputed` revocable by the driver before
the stone passes. if yes, C is the shape and the refusal window narrows.

## .where

`1.vision.experience.case=8.the-flip-flop-refused.md`

## .the verdict

_not yet ruled._
