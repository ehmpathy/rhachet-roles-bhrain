# rule.forbid.domain-term-synonyms

## .what

no **contract** may use a synonym of a term declared in
`.agent/repo=.this/role=any/briefs/domain.terms/`. use the canonical term, or open a dispute.

a **contract** is: a domain object / operation name, an internal contract (input/output shapes,
signatures), and **above all the external interfaces we publish** (api, sdk, cli). a synonym in
a contract is the violation.

a **comment** may use a synonym to describe the concept from an alternate perspective — that is
allowed. the term's `choice._.md` records the forbidden synonyms so the canonical map stays
clear.

## .why

- synonyms are the biggest culprit of ambiguity: one concept needs one canonical word
- a contract that drifts to a synonym breaks the shared vocabulary the glossary exists to keep
- published interfaces are the most expensive place to drift — every consumer inherits the
  synonym, and the cost compounds forever
- a synonym recorded in the term file (not merely forbidden) turns tribal knowledge into
  checkable data

## .how

when you find, or are tempted toward, a synonym in a contract:

1. adhere — rename the contract to the canonical term, or
2. dispute — if you believe the synonym is right (or names a genuinely distinct concept), open
   a dispute in the term's `choice.reason.md` (see `howto.domain-term-disputes.[guide].md`)

if you touch a contract that already uses a forbidden synonym, clean it up — but it may be
**left in place until disturbed** (no forced mass-rewrite).

## .the test

ask: "is this synonym in a *contract* (a name/interface), or in a *comment*?"

- contract → violation; adhere or dispute
- comment (alternate-perspective explanation) → allowed

## .mantra

> one concept, one word — everywhere a contract can be read 📜

## .enforcement

a synonym of a declared domain term used in a contract (dobj/dop name, internal contract, or
published external interface) = **blocker**
