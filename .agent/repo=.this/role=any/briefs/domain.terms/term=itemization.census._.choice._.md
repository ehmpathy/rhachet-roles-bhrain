# domain.term: census

term.chosen   = census
term.kind     = noun
term.boundary = itemization   # a completeness claim an itemization makes over its own coverage
term.synonyms.forbidden:
- tally        # a count with no claim that every member was reached
- survey       # a sample; a census is never a sample
- sweep        # the ACT of a walk (`glossary.sweep`), never the claim it yields

## .what

a **census** is a count over a declared set that claims **every member was reached**. its
distinct part is the completeness claim, never the count: a set of hits is not a census until
the instrument can say what it did not see.

a census must be able to report its own absences. an instrument that silently omits a
member (an unreadable file, a dot-prefixed path) delivers a lower bound, and a lower bound
labelled a census is a failhide.

## .refs

- `src/domain.operations/review/getOneGradeCensus.ts` — one count per grade over every run, so a
  sum never renders without the tally of what each figure was
- `src/domain.operations/review/meter/getOnePrefixCensusOfRuns.ts` (`rhx review._.cost --of run`
  and its tree/grove rollup) — every reviewer round beside its prior, with `unmeasured` counted
  so the verdicts sum to the pairs
- `rule.require.inventory-for-enumerable-concepts` — *"the omission voids the census claim"*

## .reason

- `term=itemization.census._.choice.reason.md`
