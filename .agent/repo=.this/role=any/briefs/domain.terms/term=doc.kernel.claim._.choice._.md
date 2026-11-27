# domain.term: doc.kernel.claim

term.chosen   = claim
term.kind     = noun
term.boundary = doc.kernel   # a claim is a kind of kernel: the refutable kind
term.synonyms.forbidden:
- hypothesis
- assertion
- tenet
- proposition

## .what

a **doc.kernel.claim** is a kernel that asserts a fact a test can refute. every claim is a
kernel; not every kernel is a claim (a definition is not).

a course tests each claim in vitro and gives it one verdict:

| verdict | sense |
|---|---|
| held | a test could have refuted it, and did not |
| refuted | a test refuted it; it stays out of the role's boot, and stays in the pedigree |
| untested | no test ran; the blueprint marks any brief that leans on it |

## .refs

- education.pursuit.course `2.2.greats.read`: tags each kernel claim or not
- education.pursuit.course `3.practice.vitro`: gives each claim its verdict
- education.pedigree entry: the claims table, with verdicts

## .reason

- `term=doc.kernel.claim._.choice.reason.md` — why `claim`, the rejected words, the collision
  with `route.guard.brain.dispatch.claim`
