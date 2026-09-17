# F30 · an UNREADABLE given owes a RE-RUN, never a stance

- **rework** = clean · **confidence** = 80% · **status** = best-guessed
- **raised 2026-09-14**, mid-execution at stone `5.1.execution.from_vision`, by the party the call favours

## 🔴 .the hazard that favours the author, scored FIRST

the board's own lesson (F022 gap, F023): **score the hazard that favours me first, or state why it does not apply.**

⇒ **it applies in full.** this call unblocks my own drive. nine of my eleven lanes overflowed the review window on a broken guard glob, minted `unreadable` givens, and the entrance stance gate now demands a stance on each — a deadlock i cannot pass without a code change to the engine every route shares. **i am the party the change frees.**

the three checks against that bias:
- the fix routes a malfunction to the gate that already handles a malfunction — it deletes no safety, it **relocates** one (§ *.safe*)
- it holds in the PERSISTENT case, not merely the transient one that frees me (§ *.safe*, the exit-0 path)
- a second reader is owed before the close — this row is where a council reads the call against its evidence, not against my candour

## .the fork

a lane whose given is `unreadable` — a fabricated 1-blocker, because no numeric count was readable — sits at the entrance stance gate. four ways past it:

| fork | | |
|---|---|---|
| **A** | dispute each of the nine | 🔴 semantically false. a dispute SKIPS the lane for a generation — it forecloses the re-run that is the malfunction's one remedy (`rule.always.diagnose-reviewer-malfunctions`), and mints nine fake fulcrums on the board |
| **B** ✅ | **an unreadable given owes no stance — it owes a re-run** | ✅ chosen. the entrance gate skips it; the reviewer re-runs against the narrowed guard |
| **C** | rewind the stone | 🔴 too heavy — re-arms the whole self ladder with no waiver (F023) |
| **D** | leave it | 🔴 the deadlock. the stone cannot pass |

## .taken, and why — B

a stance is a judgment about a VERDICT: a dispute says *"this verdict is fine to continue"*; a concede says *"this verdict is right."* **an unreadable given carries no verdict** — it is a malfunction, and `contract.reviewer-output` is explicit that a malfunction is *"never a rejection."* so neither word is coherent against it:

- a **dispute** skips the lane for a generation — it deletes the re-run, which is the exact remedy `rule.always.diagnose-reviewer-malfunctions` prescribes for a malfunction
- a **concede** claims a defect the reviewer never found — there is no verdict to be right about

⇒ **the honest answer is neither. the lane owes a re-run.** the `unreadable` field already sits on the given record (`getStoneUndeclaredConcerns.ts:23`); the predicate simply never consulted it.

## .the two edits — the entrance gate AND the set path, so they agree

the two gates that decide *"what owes a stance"* must not disagree:

| edit | file | what it does |
|---|---|---|
| the entrance gate skips it | `computeUndeclaredConcerns` (`getStoneUndeclaredConcerns.ts`) | an unreadable given yields `[]` — no stance demanded, the deadlock lifts |
| the set path refuses it | `assertStanceHasSubject.ts` | a `--as disputed\|conceded` on an unreadable given is refused, and the message points to diagnose + re-run |

⚠️ **without the second edit the two gates diverge** — the entrance gate would say *"no stance owed"* while the set path would still accept a stance on the malfunction, and a driver could poison the board with a dispute on a lane that has no verdict. one guard, one message each (`case=3 [t3]` — a shared message sends the driver the wrong way).

## .safe — the malfunction is RELOCATED, never deleted

fork B moves an unreadable lane off the ENTRANCE gate. every downstream gate that guards a malfunction still fires:

| the re-run outcome | what catches it | verdict |
|---|---|---|
| readable, clean | the judge tally passes | ✅ converges — the transient case (ours, guard now narrowed) |
| readable, over allowance | the judge tally rejects | ✅ halts as a rejection, owes a stance on the NEW given |
| exit non-zero | the post-run malfunction gate (`setStoneAsPassed.ts:793`) | ✅ halts as a malfunction |
| exit 0, still unreadable | the judge tally counts its fabricated 1-blocker, rejects; the lane re-runs each arrival, spends budget, then the exhaustion gate (`:719`) fires | ✅ halts as exhausted — a human-wait or a driver top-up |

🔴 **no path false-passes, and no path deadlocks.** a persistently-broken reviewer degrades to the exhaustion path — the correct terminus for a lane the driver cannot fix — rather than force an incoherent stance at the entrance.

## .rework — clean

two additive guards, each an early `[]`/throw. no state is stored, no contract shape moves, no ledger row is written. to reverse is to delete two guards and re-flip one clamp. ⇒ reachable at any time at the same cost.

## .the clamp — red before, green after

`getStoneUndeclaredConcerns.test.ts` `[case8]` asserted an unreadable given owes `['blocker.1']`. it is FLIPPED: an unreadable given owes `[]` — it re-runs. the flip is red against the old predicate and green against the new one, so the clamp bites (`rule.require.clamp-edge-cases`). a second clamp on `assertStanceHasSubject` refuses a stance on an unreadable given.

## .confidence — 80%

the mechanism is read end to end: the entrance gate order (`setStoneAsPassed.ts:384` before `:489`), the post-run malfunction gate (`:793`), the exhaustion gate (`:719`), and the `unreadable` field already on the record. what keeps it below 90%:

- 🔴 **the author bias above** — this frees my own drive, and the board measures 28%–83% of author best-guesses reversed. the second reader is owed
- the persistent exit-0 path degrades to exhaustion rather than to a named malfunction, which is correct but less loud than a malfunction halt — a council may prefer the malfunction gate also key on `unreadable`, not merely on exit code. that is a wider change this row does not take
- an alternative exists that i did not build: teach the post-run malfunction gate to treat `unreadable` as a malfunction regardless of exit code, so an exit-0 overflow halts LOUD rather than exhausts QUIET. weighed, deferred — it is a wider blast radius than the deadlock demands, and the exhaustion terminus is safe. a `.dream/` candidate

## .where

`src/domain.operations/route/guard/review/peer/getStoneUndeclaredConcerns.ts` — the entrance predicate ·
`src/domain.operations/route/guard/review/peer/assertStanceHasSubject.ts` — the set-path guard ·
`src/domain.operations/route/stones/setStoneAsPassed.ts:384` — the entrance stance gate · `:793` — the post-run malfunction gate · `:719` — the exhaustion gate ·
`contract.reviewer-output` — a malfunction is never a rejection ·
`rule.always.diagnose-reviewer-malfunctions` — the remedy is diagnose + re-run, never a stance ·
`.reviews/peer/5.1.execution.from_vision._.review.i003.*.taken.by_self.*` — the nine diagnosis takens that narrowed the guard

## .what would settle it

a second reader — a peer or the council — reads the four-row safety table and confirms no path false-passes. and a read of whether the post-run malfunction gate SHOULD key on `unreadable` (loud) rather than leave an exit-0 overflow to exhaust (quiet).

## .the verdict once ruled

_unruled — best-guessed at 80%, the second reader is owed._
