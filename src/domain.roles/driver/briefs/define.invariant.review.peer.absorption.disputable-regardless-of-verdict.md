# define.invariant.review.peer.absorption.disputable-regardless-of-verdict

## .what

every review **concern** that counts toward the judge's tally is DISPUTABLE by the driver,
regardless of the lane's reviewer verdict — approved, rejected, or exhausted alike.

## .kind

**nurture**, grounded in a **nature** fact.

- the nature fact: the `reviewed?` judge tallies blockers and nitpicks **stone-wide**, across every
  non-overruled lane (`computeReviewTotalsFromFiles`). so an APPROVED lane's nitpicks still count
  against the threshold. no design decision changes this — it is how the tally sums.
- the nurture choice: given that fact, a dispute is the driver's per-concern tally-exclusion, and it
  must be available at **every** lane that counts. we chose this so the driver always holds a lever
  to reduce a tally its own lanes pushed over the floor.

## .the invariant

```
a concern COUNTS toward the tally  ⇒  the driver MAY dispute it
```

equivalently: the set of DISPUTABLE concerns = the set of concerns the tally COUNTS. the only
concerns that are not disputable are the ones that do not count — a forgiven level (excluded from
the tally), a lane that never spoke (no concern), an unreadable given (a malfunction, answered by a
re-run, not an absorption).

## .why the domain depends on it — the incident, 2026-09-15

a driver disputed all 12 concerns on the one REJECTED l3 lane. the gate cleared. yet the judge still
failed: **residual 14 nitpicks > threshold 7**, and all 14 sat on APPROVED/exhausted l1 lanes, each
individually under the per-lane threshold and so each `approved`. the set path refused a dispute on
them, on the ground that an approved lane holds the road and so raises no verdict to dispute.

⇒ **a stone with many small-nitpick lanes could never pass.** the judge summed them past the floor,
and the driver held no lever to shed them — not dispute (refused on approved lanes), not a re-run
(cached lanes reuse their count), not a fix (a src change re-mints the hash and re-runs the
non-deterministic lanes). the one lever left was a human overrule, for `better` maintenance nitpicks
on a faithful implementation.

## 🔴 .OWED ≠ PERMITTED — the distinction the invariant forces

two questions, and one check cannot answer both — they key on different things:

| question | operation | keys on |
|---|---|---|
| which concerns are **OWED** an absorption — demanded before passage | `getStoneUndeclaredConcerns` (the entrance gate) | the verdict — only a **rejected** lane owes one |
| which concerns are **PERMITTED** an absorption — the driver MAY declare | `assertAbsorptionHasSubject` (the set path) | **any lane that counts** — the verdict aside |

a driver is never FORCED to declare on an approved lane; but they MAY, and must, to shed its
nitpicks from a tally they push over the floor.

## .scope

- governs the SET path (an absorption the driver declares). it does NOT widen the entrance gate: the
  gate still demands absorptions only where the verdict rejects.
- does NOT make a forgiven / no-given / unreadable concern disputable — those do not count toward the
  tally (forgiven), name no concern (no-given), or carry no verdict (unreadable → re-run, F030).

## .the litigation

the narrow read — *a dispute needs a rejection to answer* — was argued and refused. the refusal
rests on a requirement, never a preference: a dispute must still reach a concern on an approved
lane, because **every** concern is thoroughly disputable, the reviewer's status aside.

⇒ what makes it a requirement over a courtesy is the incident above. the narrow read leaves a
driver with no lever at all against a tally its own approved lanes pushed over the floor, so the
narrowness is not a bound on the feature — it is a hole in it.

## .the counter-argument, stated fairly

*"an absorption answers a REJECTION; an approved lane raises no hold to lift, so a dispute on it has no
subject."* it is true of the lane's OWN verdict and false of the stone-wide tally: the concern still
counts, so the hold it contributes to is real even where the lane approves. the counter mistakes the
per-lane verdict for the tally the judge actually sums.

## .what would overturn it

- the judge stops to tally stone-wide (counts only rejected lanes, or per-lane) — then an approved
  lane's concerns no longer count, and the nature fact beneath this invariant is gone. **this is the
  event to watch**: the invariant is nurture on top of the stone-wide tally, so a change to the tally
  grain is what would retire it. (a severity-aware tally that passes all-`better` — the deferred
  `#31`/`#499` work — would ALSO relax the pressure, but it does not remove the lever.)

## .enforcement

- a set path that refuses a dispute on a lane whose concern COUNTS toward the tally = **blocker**
- an entrance gate that DEMANDS an absorption on an approved lane (it widens OWED into PERMITTED) =
  **blocker** — a driver must never be forced to declare on a lane that holds the road

## .see also

- `define.invariant.review.peer.passage` — `PASS ⟺ every peer guard is terminal`
- `define.invariant.review.peer.exhausted`
- `rule.forbid.suppression-of-undeclared-concerns` — a dispute sheds only the concern it NAMES
- `rule.require.judge-derived-counts` — the tally the driver disputes against
