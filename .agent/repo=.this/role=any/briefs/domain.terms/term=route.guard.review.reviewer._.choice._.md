# domain.term: reviewer

term.chosen   = reviewer
term.kind     = noun
term.boundary = route.guard.review
term.synonyms.forbidden:
- lane
- rubric run
- review pass

## .what

**one graded run of one rubric against one subject, under one guard, at one iteration.**

it is what the guard tallies, what `contract.reviewer-output` binds, and what `rN` names in a guard's stdout — `r1: dimensional-decomposition`, `r2: experience-coverage`.

🟡 the word carries a second sense — `repo=bhrain/role=reviewer`, the role.

- the two are declared here as **one** term, because a run is an invocation of the role
- **the overload is inherited, never resolved**
  - the `lane` dispute settled for the *inconsistency* repair — one concept, one word
  - so the *ambiguity* repair — one word, two concepts — is an open gap
  - ⇒ the run-sense still has no word of its own. see `.reason`

## .refs

- `.agent/repo=bhrain/role=reviewer/briefs/contract.reviewer-output.md` — the stdout contract a reviewer must satisfy
- `rule.always.converge-with-reviewers` (driver) — the convergence loop, named for this term
- `rule.always.diagnose-reviewer-malfunctions` (driver) — named for this term, and its body was conformed to it 2026-09-06
- `term=route.guard.review.tallier` · `.terminal` · `.malfunction` · `.clearance` — the eight peers under this boundary

## .reason

- `term=route.guard.review.reviewer._.choice.reason.md`
