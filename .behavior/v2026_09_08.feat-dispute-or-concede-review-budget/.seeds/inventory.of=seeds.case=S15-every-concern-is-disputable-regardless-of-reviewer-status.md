# S15 · every concern is disputable regardless of reviewer status

- **kind** = a correction (a fundamental invariant the implementation violated)
- **said** = 2026-09-15, after the driver hit a wall: 12 disputes on the rejected l3 lane cleared,
  but the `reviewed?` judge still failed on a stone-wide residual of 14 nitpicks, all on
  APPROVED/exhausted lanes the driver could not dispute (R2 refused them).

## .said — verbatim

> dispute MUST be able to still address this;

> thats a fundamental invariant's requirement
> all concerns must be thoroughly disputable regardless of reviewer status

> solve and clamp that behavior

## .settled

**R2 was too narrow.** the set path (`assertStanceHasSubject`) refused a stance on any lane whose
verdict held the road — so an APPROVED lane's concerns could not be disputed. but the `reviewed?`
judge tallies nitpicks STONE-WIDE across every non-overruled lane, so an approved lane's nitpicks
still count against the threshold.

⇒ **the two facts are incompatible: a concern that COUNTS toward the tally the driver cannot shed.**
a stone with many small-nitpick lanes, each individually approved, sums past the floor with no driver
lever to reduce it under the floor.

**the invariant:** every concern that counts toward the tally is DISPUTABLE, regardless of the
lane's reviewer status — approved, rejected, or exhausted alike. a dispute is the driver's
per-concern tally-exclusion, at every lane that counts.

## .the distinction it forces — OWED ≠ PERMITTED

the fix decouples two questions the design had answered with one check:

| question | operation | keys on |
|---|---|---|
| which concerns are **OWED** a stance (demanded before passage) | `getStoneUndeclaredConcerns` (the entrance gate) | the verdict — only a rejected lane owes one |
| which concerns are **PERMITTED** a stance (the driver may declare) | `assertStanceHasSubject` (the set path) | 🔴 **any lane that counts** — verdict aside |

⇒ a driver is never FORCED to declare on an approved lane, but they MAY — and must, to shed its
nitpicks from a tally they push over the floor.

## .the three refusals that remain — none is a reviewer verdict

- a **forgiven** level — a human lifted it, and its files are excluded from the tally, so its
  concerns count naught (there is naught to shed)
- **no given** — the reviewer never spoke, so there is no concern to name
- an **unreadable** given — a malfunction, answered by a re-run, never a stance (F030)

## .landed

- `src/domain.operations/route/guard/review/peer/assertStanceHasSubject.ts` — the approved-verdict
  refusal removed; the `allowBlockers`/`allowNitpicks` params dropped (now unused)
- `src/domain.operations/route/guard/review/peer/getStoneUndeclaredConcerns.ts` — the comment that
  claimed the gate and the set path share the approved check corrected (owed ≠ permitted)
- `src/domain.operations/route/stones/setStoneAsStanced.ts` — R2 doc + the call updated
- `assertStanceHasSubject.test.ts` case4 — flipped: an approved lane is a real subject (the clamp)
- `setStoneAsStanced.integration.test.ts` case3 — end-to-end: a dispute on an approved lane is
  accepted and recorded (the clamp bites — the old code threw `does not hold the road`)
