# domain.term.choice.reason: domain-term

## .etymology
from domain-driven design: the **domain** is the problem-space a repo models, and a **term** is
a single word in its ubiquitous language. a `domain-term` is thus one word of the repo's own
vocabulary. chosen over `glossary-entry` (names the storage, not the concept), `vocab-word`
(loose), and `lexeme` (linguistics jargon a domain expert would not say).

## .the term is the word, not the dobj/dop
the declared domain objects & operations are the ANCHOR — they are what "born in this repo"
means. but the itemized unit is the **word** they are built from: the noun `stone` serves
`Stone`, `getStone`, `genStone` alike; the verb `gen` serves every `gen*`. one entry per word,
reused. so a `domain-term` is finer-grained than a dobj/dop: it is the morpheme, not the name.

## .disputes
none. the term was introduced by this wish and no synonym has been argued for it in a contract.

## .evidence
- discovery: the wish + vision named the unit directly — "every domain term (a noun/verb/adj)
  that composes the repo's declared domain objects & operations must be itemized"
- invariants: one word → one cluster, reused across all its declarations (no duplicate file per
  dobj/dop); generic english + package-imported vocab are out of scope
