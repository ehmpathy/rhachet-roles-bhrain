## .what

extend the learner's obsessive-capture nature to **domain invariants** — the durable, declared
must-hold rules of the domain (e.g. `define.invariant.review.peer.passage.md`,
`define.invariant.review.peer.exhausted.md`) — just as it already captures **domain terms** into
`domain.terms/`.

## .why

- a domain invariant discovered mid-flow (a settled must-hold rule like "PASS ⟺ every peer-review
  guard is terminal") is a lesson at risk. today the learner has a home + obsession for domain
  *terms* but not for domain *invariants* — so an invariant lands ad-hoc, or is lost.
- invariants are the load-bearing contracts of the domain. a captured invariant, cited with
  evidence, stops the next traveler from re-litigation (or re-breakage) of a settled rule. this
  very fix (fix-route-overruled) was a regression of an *undeclared* invariant.

## .the parallel to domain terms

| domain terms | domain invariants |
|---|---|
| `domain.terms/term=<x>._.choice._.md` | `briefs/define.invariant.<scope>.md` |
| itemize the moment a term is coined/debated | itemize the moment an invariant is settled/discovered |
| say + required `.reason` | statement + `.why` + evidence + enforcement |
| `im_an.obsessive_learner.for.domain.terms.md` | `im_an.obsessive_learner.for.domain.invariants.md` (seed added in this PR) |

## .scope

- [x] seed `im_an.obsessive_learner.for.domain.invariants.md` (added here) + wire into `boot.yml`
- [ ] `rule.require.domain-invariant-itemization.md` — every settled invariant gets a declared
  `define.invariant.*` brief with statement / why / evidence / enforcement
- [ ] `readme.domain-invariants.md` — the home + shape (mirror `readme.domain-terms.md`)
- [ ] `template.domain-invariant.md` — the canonical brief shape
- [ ] onStop sweephook nudge parity (learner reflects on invariants discovered, like terms)
- [ ] `progress.md` articulation covers invariants distilled per round
- [ ] tests + `learn.integration.test.ts` snapshot updates

## .evidence / prior art

- terms obsession: `src/domain.roles/learner/briefs/im_an.obsessive_learner.for.domain.terms.md`
- terms readme: `src/domain.roles/learner/briefs/readme.domain-terms.md`
- two invariants already declared (the pattern to institutionalize):
  `.agent/repo=.this/role=any/briefs/define.invariant.review.peer.passage.md` and
  `.agent/repo=.this/role=any/briefs/define.invariant.review.peer.exhausted.md`
