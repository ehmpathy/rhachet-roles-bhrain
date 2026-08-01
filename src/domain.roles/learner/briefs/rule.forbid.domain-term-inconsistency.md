# rule.forbid.domain-term-inconsistency

## .what

no single concept may be named with more than one word across the codebase. where two or more
words name the **same** concept — and no canonical term has yet been declared — the vocabulary is
**inconsistent**, and the inconsistency is forbidden.

this is the pre-canon twin of `rule.forbid.domain-term-synonyms`: that rule forbids a drift away
from a term already declared canonical; this rule forbids the codebase from a disagreement with
**itself**, before any canon exists.

## .why

- inconsistency is synonym sprawl caught in the wild: `spot` here, `location` there, `place`
  elsewhere — one concept, three words, no glossary entry to settle them.
- left unsettled, a reader cannot tell whether three words mean three concepts or one.
- the inconsistency is a signal that a term has earned its coinage — the concept recurs enough to
  deserve one canonical word.

## .the test

ask: "is this concept named the same way everywhere it appears?"

- one word everywhere → consistent
- two or more words for the one concept → inconsistent; coin the canonical term, conform the rest

## .how

when you find the same concept under two or more words:

1. confirm they are truly one concept (not a distinction concealed under a shared shape)
2. choose the canonical word (`howto.domain-term-disputes.[guide].md` when arguable)
3. itemize it (`rule.require.domain-term-itemization`); conform the other uses, or leave them
   until disturbed (no forced mass-rewrite)

## .mantra

> one concept, one word — even before the glossary names it 📜

## .enforcement

a single concept named with two or more words across contracts, with no canonical term declared =
**blocker**
