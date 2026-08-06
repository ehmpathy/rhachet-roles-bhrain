# domain.term.choice.reason: forgive

## .etymology
the route domain frames a peer-review level as a debt the driver owes: blockers are the
debt, and passage requires the debt settled. a driver settles it by **convergence**
(fix the code, or articulate why it holds → the reviewer approves). a human may instead
settle it by grant — and the word for a debt cancelled by grant, not by payment, is
**forgive**.

chosen over:
- `waive` — reads procedural (a waiver of a rule), not the relational "the human absolves
  this level"; also collides with fee/right jargon
- `pardon` / `excuse` — carry a moral/apology tone the mechanism does not have
- `wave-through` — the humans' spoken phrase (kept as a forbidden synonym so the map is
  clear), but too informal for a contract; also visually confusable with `waive`
- `bypass` / `skip` — these name the FEARED failure (the whole `fix-route-overruled`
  behavior exists because an overrule must NOT let a driver *skip* a higher level). to reuse
  `skip`/`bypass` for the legitimate act would overload the exact word we reserve for the bug.

the adjective **unforgiven** (a reviewer still owed) pairs symmetrically with **forgiven**,
so `getStoneGuardReviewPeerUncontemplatedUnforgiven` reads as "the reviewers not yet
absolved" at a glance.

## .disputes
none yet.

## .evidence
- discovery: scenario-timeline of the false-provenance fix — the whole
  `fix-route-overruled` behavior turns on WHO forgives WHICH level, and whether a fresh
  overrule has a level left to forgive at all. an overrule with no un-forgiven, un-approved
  target mints a false "forgiven by human" record (the r7/r10 blocker this session fixed).
- invariant: forgiveness is **level-scoped** — an overrule forgives exactly the named
  level and unlocks the next; it never forgives a level above (design-note: an overrule is
  a key for one gate, not a skeleton key for the corridor).
- invariant: PASS ⟺ every peer level terminal, where terminal = approved (on merit) OR
  forgiven (overruled) OR exhausted OR malfunction OR constraint.
