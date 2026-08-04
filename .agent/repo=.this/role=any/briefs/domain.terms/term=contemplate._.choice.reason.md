# domain.term.choice.reason: contemplate

## .etymology
peer review in this domain is a **conversation**, not a verdict: a reviewer's `.given`
critique invites the driver's `.taken` reply. the word for the driver's side of that
exchange had to name a genuine act of thought — a read of the critique, then either a fix
to the code or an argument for why it holds — not a rubber-stamp. **contemplate** (from the
bhrain owl's meditative register) carries exactly that: to sit with a critique and answer it
in earnest.

chosen over:
- `consider` / `reflect-on` — too passive; they do not imply the written `.taken` artifact
  the gate actually requires
- `address` / `respond` — too mechanical; they read as "reply sent", short of the
  "questioned yourself severely" weight the review-as-work ethic demands
- `acknowledge` — implies mere receipt, the opposite of the required engagement

the noun form is **contemplation** (the gate, the status); the adjective **uncontemplated**
(a critique still owed a `.taken`). the whole cluster reads in the owl's voice and holds one
sense throughout.

## .disputes
none yet.

## .evidence
- discovery: scenario-timeline — a stone with an in-tolerance blocker (verdict `approved`,
  so `activeLevel === null`) can STILL be held by the contemplation gate, because a blocker
  within threshold is approved-for-passage yet still owes a `.taken`. this session's fix
  turned on exactly that: an overrule is a legitimate escape from the contemplation gate
  (design-note B6) only when a reviewer is uncontemplated AND un-forgiven.
- invariant: the contemplation gate requires a `.taken` for every current-iteration peer
  critique with blockers > 0 — a 0-blocker (clean or nitpick-only) critique owes no `.taken`.
- invariant: a reviewer at an overruled (forgiven) level owes no `.taken` — the human took
  responsibility, so the driver's contemplation duty is discharged for that level.
