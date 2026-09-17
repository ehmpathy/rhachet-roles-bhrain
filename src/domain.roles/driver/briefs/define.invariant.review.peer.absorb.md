# define.invariant.review.peer.absorb

## .what

a body of peer feedback is **absorbed** only when every **concern** it enumerates is absorbed —
each disputed or conceded. to absorb one concern is to render its disposition with its argument; to
absorb the feedback is the `.taken` (the reviewer-grain act), and it is **accepted only once every
concern within it is absorbed**. absorb-the-feedback is COMPOSED of absorb-each-concern — the coarse
act builds on the fine ones and is gated on them.

## .kind

**nature**, grounded in a mereological fact, with a **nurture** enforcement on top.

- the nature fact: a reviewer's given IS the set of concerns it enumerates. a whole made of parts is
  taken up exactly when each part is. so *"feedback absorbed, a concern within it un-absorbed"* names
  no coherent state — it is feedback ignored under cover of a response. no design decision changes
  this; it is what *absorb the feedback* MEANS.
- the nurture choice: given that fact, the engine gates the `.taken` — and passage — on it. the whole
  is enforced through its parts: an added precondition refuses the feedback-grain act while any
  concern within it stands un-absorbed, rather than trust a coarse per-reviewer acknowledgement to
  have covered each one.

## .the invariant

```
feedbackAbsorbed(given)  ⟺  ∀ concern ∈ given : absorbed(concern)
```

where `absorbed(concern)` = the driver declared `disputed` or `conceded` on it, against the given it
was numbered within. **to absorb the feedback is a real act — the `.taken` — but it is only ACCEPTED
once every concern within it is absorbed.** the whole is composed of its parts; the act that records
the whole is gated on each part.

## 🔴 .the two acts

the design runs **two** acts, at two grains, and the coarse one is gated on the fine one:

| the act | grain | what it is | gated on |
|---|---|---|---|
| absorb a concern | one concern | a disposition (dispute\|concede) + its argument | — |
| absorb the feedback | the reviewer's given | the `.taken` | **every concern within it absorbed first** |

each act carries its own record, and neither stands in for the other:

- a **disputed** concern carries its argument in the fulcrum the `--why` names.
- the **`.taken`** records the driver's engagement with the reviewer as a whole.

⇒ **absorb-the-feedback is COMPOSED of absorb-each-concern.** the `.taken` cannot be accepted while
any concern within it stands un-absorbed — the per-concern disposition is the precondition that makes
the composition hold.

## .scope

- governs **acceptance of the `.taken`** (feedback absorption): it is refused while any concern of
  that given stands un-absorbed. this is the added gate — a precondition, ahead of the extant
  answer-first gate, not a replacement for it.
- governs **passage**: the stone cannot pass while any concern of a given that counts is un-absorbed.
- does NOT reach a concern that carries no hold — a forgiven level (excluded from the tally), a lane
  that never spoke (no concern), an unreadable given (a malfunction, answered by a re-run, not an
  absorption; `F030`).

## .the litigation

the rename `contemplated` → `absorbed` and the law it implies were settled together, and that is the
whole argument: once the verb is `absorb`, the law is already in the word. to absorb a reviewer's
feedback is permitted only once each concern within it is absorbed — a lesser bar is not absorption
at all, it is a receipt.

on scope, the verdict took **both** halves. the rename reaches every surface, and the added gate
ships with it; the vision is reframed and the implementation fixed to match. ⇒ it is a rename plus a
gate, never a teardown — the extant answer-first gate stays, and this one precedes it.

## .the counter-argument, stated fairly

*"the gate is redundant — the `.taken` already engages the reviewer, so demanding a disposition per
concern first is ceremony."* it is not: the `.taken` engages the reviewer as a whole, and a whole
response can be written while a concern within it stands un-addressed — the exact failure
`rule.always.converge-with-reviewers.via-a-taken-per-point` already warns of. the gate makes the
per-concern discharge a **precondition** the whole cannot be accepted without, so the composition is
enforced by construction rather than left to the driver's diligence.

## .what would overturn it

- a per-reviewer response genuinely complete without a per-concern disposition — a whole that is not
  the sum of its concerns. none is known: a reviewer's given IS its concerns, so a response to the
  whole that skips a part skips a part. **this is the event to watch**: were a whole-only response
  found sufficient, the added gate would be ceremony.
- the judge stops to tally concern-by-concern (e.g. per-reviewer pass/fail with no concern
  enumeration) — then a concern is no longer the atom, and the mereology beneath this invariant is
  gone.

## .enforcement

- a passage that clears while any concern of a given that counts is un-absorbed = **blocker** (the
  whole was called absorbed with a part un-absorbed).
- a `.taken` (feedback absorption) accepted while a concern of that given stands un-absorbed =
  **blocker** — the added gate is the composition's precondition, and it must fire ahead of the
  answer-first gate.
- a driver declaration that discharges the feedback as a whole with no disposition on each concern =
  **blocker** — the whole is composed of its parts, never declared over them.

## .see also

- `define.invariant.review.peer.passage` — `PASS ⟺ every peer guard is terminal`
- `define.invariant.review.peer.absorption.disputable-regardless-of-verdict` — which concerns a driver MAY absorb
- `rule.forbid.suppression-of-undeclared-concerns` — an absorption discharges only the concern it NAMES
- `rule.always.absorb-every-concern` (driver) — the conduct rule this invariant grounds
- `term=route.guard.review.absorption._.choice._.md` — the disposition an absorption renders
