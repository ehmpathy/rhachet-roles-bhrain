# F35 · the r010/r011 peer givens are stale re-raises — dispute, do not concede

- **rework** = clean · **status** = 🔴 **best-guessed** (5.1 execution, r010/r011) — the council rules
- **confidence** = 90%
- **where** = the two peer lanes at i007 — `enroll-impl-behavior-intent` (r010) and
  `enroll-impl-arch-defects` (r011). backs 7 disputes, one concern each (S07).

## .the concern, in one line

both lanes re-raised concerns whose fixes had ALREADY landed. every citation reproduces an earlier
round's pre-fix line numbers (`:29-31`, `:81-83`, `:322-328`), and both givens carry a malfunction
signature: `clone enrolled — deaf, so it cannot hear a say` + `no stdin data received in 3s`. a deaf
clone that received no stdin reviewed a snapshot that predates the repairs.

## .the concerns this fulcrum backs, each verified fixed against the live tree

| lane · concern | claim | the live tree |
|---|---|---|
| behavior-intent blocker.1 | Infinity ack has no guard | `formatRouteGuardReviewPeerStanceAck.ts:32-38` guards `Infinity` on both branches; `[case7]` clamps it |
| behavior-intent blocker.3 | i006 threads have no `.taken`; `rubric` not a domain term | debt keys to the LATEST given (`getLatestPeerGivensPerSlug`), so i007 supersedes i006; `rubric` is inherited reviewer vocabulary, out of scope for `rule.require.domain-term-itemization` |
| behavior-intent nitpick.1 | detached JSDoc in `formatReviewBudgetTopupCommand.ts` | `:1-9` docs the const, `:12-23` docs the fn; each block sits above its symbol |
| arch nitpick.1 | `formatArtifactStderrBlock` allowlists on `error.message` | `setStoneAsPassed.ts:80-85` keys on `error.code` via `isExpectedFsReadFault` |
| arch nitpick.2 | Infinity guard absent (same as behavior blocker.1) | same fix, same clamp |
| arch nitpick.3 | `assertStanceHasSubject` returns `void`, five `given!` | `:39`/`:100` return the narrowed given; `Grep given!` → zero |
| arch nitpick.5 | doc-block misplacement (same as behavior nitpick.1) | same file, blocks attached |

⇒ the `.taken` files quote the current file line-for-line:
- `.reviews/peer/5.1.execution.from_vision._.review.i007.9d3239b369c0d8538e.r010._.taken.by_self.enroll-impl-behavior-intent.md`
- `.reviews/peer/5.1.execution.from_vision._.review.i007.9d3239b369c0d8538e.r011._.taken.by_self.enroll-impl-arch-defects.md`

## .the fork, stated fairly

| fork | this round would… |
|---|---|
| **A — dispute as stale** *(taken)* | declare the current code fine to continue, cite this fulcrum, let the lane go quiet one generation, and hand the council a verified-fixed diagnosis to rule on |
| **B — concede and re-arrive** | record *"the reviewer is right and I will fix it"* — a false statement, since every fix already landed; then re-arrive with no code change, which risks a re-raise loop against a reviewer that malfunctions each round, bounded only by budget exhaustion (the exact resolution-by-exhaustion this whole behavior exists to prevent) |

## .taken, and why

**A.** a concede commits the driver to a repair (`the hold stands. fix, then re-arrive`). there is
no repair to make — the fixes landed in prior rounds and are verified line-for-line in the two
`.taken` files. so a concede writes a false record AND risks the exhaustion loop, where a dispute is
honest (the code IS fine to continue), deterministic (the road proceeds), and cheap for the council
(one fulcrum, verified, ruled in seconds — the vision's *"under a minute"*).

this is `rule.always.diagnose-reviewer-malfunctions` met through the one lever the entrance stance
gate offers: a malfunction is a broken process, not a verdict, and its remedy is a re-run against
the live tree. the dispute clears the gate so the next generation re-runs; the fulcrum records the
diagnosis; the council backstops the staleness claim.

## 🟡 .the honest case FOR B, which A does not fully answer

a dispute on every concern of both lanes is the max-hazard shape the vision flags — *"the driver
disputes every lane."* the wisher's norm is concede-by-default, dispute-as-rare-escalation (S11).
so a reviewer that reads *"10 disputes"* on one re-arrival will suspect the driver grades its own
escape.

⇒ the answer A rests on: the norm presumes the flagged concerns are REAL. these are stale, verified
concern-by-concern against the live tree, and a dispute on a stale re-raise is not the escape the
norm guards against — it is the honest response to a wholesale reviewer malfunction. the board's own
six prior disputed rows (F025, F026, F030–F033) establish that a stale/refuted concern is disputed
on this route, never conceded.

## .what would settle it

| evidence | it would move the call toward |
|---|---|
| a council read that confirms each cited fix is present in the tree | **A** |
| a fresh reviewer run (a live clone) that finds a concern still active | **B** for that concern |

## .the verdict

*(unruled — the council rules at the close)*
