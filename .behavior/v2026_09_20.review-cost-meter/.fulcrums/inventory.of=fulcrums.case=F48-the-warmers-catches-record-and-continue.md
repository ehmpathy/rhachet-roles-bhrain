# fulcrum F48 — the warmer's catches record and continue, in a process with no terminal

- rework = clean
- status = 🟡 **DISPUTED 2026-09-26 — option A, keep both catches**
- confidence = 🟡 **78%**
- raised.by = peer lane `mech-failhides`, nitpick.2 and nitpick.3, round hash `f9989f17260b48b058`

## .the fork

`runReviewWarmer` holds two catches the lane reads as wider than their allowlist:

| catch | what it takes | what it does |
|---|---|---|
| the voice sink write | any error with a `code` (every fs fault) | `console.error`, then continue; a code-less error rethrows |
| one poke | any error | writes an `act: 'fault'` row to the ledger, spends a slot, continues |

### A — keep both (taken)

the warmer is spawned `detached` with `stdio: 'ignore'`. **a rethrow there reaches no reader** — it
ends the process, the plan stops mid-budget, and the only trace is a ledger that stops. so the
catch does not hide a fault; it moves it to the one place a reader looks:

- a poke fault lands in the ledger as a row, with `why: String(error)`. a local defect recurs on
  EVERY row, so `review._.cost` shows a plan of all-`fault` rows — louder than a ledger that stops
- the voice sink is a convenience copy; the ledger is the record. a full disk that fails the sink
  fails the ledger write on the next row too, and that one is not caught

### B — narrow each allowlist and rethrow the rest

correct in an attached process. 🔴 detached, it trades a recorded fault for a silent exit.

## 🟡 .why 78%, not higher

- the lane's deeper point holds: `fault` names no class, so a reader must read `why` to part a
  provider timeout from a local defect. a `faultKind` field would part them without a rethrow —
  a render change, left to the council
- the ESRCH half of the same feedback (nitpick.1) was a genuine narrow allowlist with a genuine
  reader (the lock), and was fixed

## .scope narrowed — the voice sink now takes B, the poke keeps A

the voice sink's allowlist now names the errno codes a write can be refused with
(`isErrorOfWriteRefusal` — ENOSPC, EDQUOT, EROFS, EACCES, EIO, and their kin) and rethrows every
other throw. this fork now covers **one** catch: the per-poke row, where a rethrow in a detached
process still ends the plan with no reader.

## .where

- `src/domain.operations/review/warmer/runReviewWarmer.ts`
