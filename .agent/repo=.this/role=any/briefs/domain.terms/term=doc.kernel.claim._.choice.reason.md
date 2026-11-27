# domain.term.reason: doc.kernel.claim

## .etymology

a claim asserts that a fact holds, and invites a challenge. that is the sense the learner's own
rules already use: `rule.require.a-cue-is-not-a-claim` defines a claim as what *asserts a fact a
reader may act on*. a refutable kernel is exactly that, so the word is reused in the sense it
already holds, narrowed to kernels.

rejected:
- `hypothesis` — names a guess made before evidence; a great's claim arrives with evidence, and
  only our test of it is new
- `assertion` — collides with test assertions (`expect(...)`), the very tests that judge a claim
- `tenet` — a held belief of a school; implies it is already accepted
- `proposition` — logic jargon; reads as true-or-false in the abstract, not refutable in practice
- `kernel` alone — too wide: it covers definitions, which no sandbox can refute

## .disputes

### dispute: kernel — raised 2026-11-24 — status: RESOLVED (claim wins for the refutable kind)
- raised.by  = the driver, in the vision of the education suite
- claim      = keep `kernel` for every unit a course tests; mark the irrefutable ones `untested`
- counter    = the wisher: `claim` names the refutable kind better, and should be declared
- resolution = `claim` is declared as a kind of kernel (`doc.kernel.claim`). vitro gives
  verdicts to claims only; `untested` now means a claim with no test, never a definition

## .boundary

"claim, of what?" → of a kernel: the refutable kind. `doc.kernel.claim`.

🟡 `route.guard.brain.dispatch.claim` is a different concept (a reservation that one dispatch is in
flight). the two are a boundary-qualified pair, which `rule.forbid.domain-term-ambiguity` permits;
each is cited by its full name.

## .evidence

- course stone `3.practice.vitro` needs a unit a test can refute; a kernel that defines cannot be
  refuted, so the verdicts held / refuted / untested apply only to claims
- the pedigree entry records each claim with its verdict; a refuted claim stays on record so the
  next reader knows what the role tried and rejected

## .invariants

- every claim is a kernel; a kernel is a claim ⟺ a test could refute it
- a claim carries exactly one verdict: held, refuted, or untested
- a refuted claim never enters a role's boot
