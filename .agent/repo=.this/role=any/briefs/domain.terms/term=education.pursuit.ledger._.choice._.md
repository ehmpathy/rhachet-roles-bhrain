# domain.term: education.pursuit.ledger

term.chosen   = ledger
term.kind     = noun
term.boundary = education.pursuit   # "ledger, of what?" → of one pursuit's courses
term.synonyms.forbidden:
- status
- progress
- state
- tally

## .what

an **education.pursuit.ledger** is one pursuit's account of its courses: what the plot names,
what the disk holds, which are open, which are owed (plotted, not yet exited, in plot order; the
first is next), and which are strays (held on disk, no longer plotted). the pursue judge,
`course init`, and `pedigree set` each read the one ledger, so "every course done" has one
definition.

## .refs

- src/domain.operations/education/getOnePursuitLedger.ts

## .reason

- `term=education.pursuit.ledger._.choice.reason.md`
