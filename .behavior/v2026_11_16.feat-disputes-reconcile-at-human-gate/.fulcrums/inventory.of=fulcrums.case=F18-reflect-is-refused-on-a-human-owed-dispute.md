---
case: F18
rework: clean
ground: wrong
confidence: 0.80
status: open
owed: none
holds: []
lean: --reflect is refused on a dispute that owes a human, where the vision sketched it accepted and recorded
verdict: null
---

# F18 — `--reflect` is refused on a dispute that owes a human

## .the fork

the vision (R41) sketched `--reflect` on a wrong-ground dispute below 0.90 as accepted and
recorded, with `owed` left `human`. the code refuses it (`assertFulcrumFitsDispute`).

- A: refuse it, and name the fix: drop `--reflect`; the dispute waits for a human
- B: accept it, record the ref on the dispute row, and leave `owed: human`

## .taken, why

A. on a human-owed dispute the flag routes naught: the gate still asks the human, and the ref
reaches no surface the human reads. to accept a flag that changes no outcome reads, to the driver
who typed it, as if the dispute went upstream — a surprise the refusal prevents. `--reflect` keeps
one sense: this dispute is owed upstream. a driver below 0.90 who still wants an upstream report
files it with `rhx radio.task.push` and cites it in the fulcrum body.

## .rework, why

clean. B is one throw removed, one optional field on the dispute row, and the `[t0b]` refusal snap
turned to an accept.

## .confidence, why

the vision named B on purpose, and a human may want the ref recorded even where it routes naught.
the call reverses a sketched contract on a judgment of surprise, with no measured miss behind it.
80%.

## .where

`src/domain.operations/route/fulcrum/assertFulcrumFitsDispute.ts` (the human-owed refusal) ·
`blackbox/driver.route.dispute-passage.journey.acceptance.test.ts [t0b]`.

## .verdict

open. a design call; owes no dispute.
