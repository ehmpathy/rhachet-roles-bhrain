# domain.term: rebase

term.chosen   = rebase
term.kind     = noun                 # also a verb: the context rebases
term.boundary = transcript.call
term.synonyms.forbidden:
- reset
- drop
- truncation

## .what
a call at which the context did not grow from the one before, but restarted from a smaller base —
by a `compaction` (the harness summarized the history) or a `shrink` (the context fell with no
compaction on record). every block held before it ends there.

## .refs
- src/domain.objects/Reflector/TokenSpendReport.ts (`TokenSpendRebase`)
- src/domain.operations/reflect/tokens/getOneTokenInventory.ts

## .reason
- `term=transcript.call.rebase._.choice.reason.md`
