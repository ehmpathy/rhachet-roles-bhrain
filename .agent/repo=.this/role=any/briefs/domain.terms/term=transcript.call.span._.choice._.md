# domain.term: span

term.chosen   = span
term.kind     = noun                 # one priced stretch of a call's prompt
term.boundary = transcript.call
term.synonyms.forbidden:
- segment
- range
- region

## .what
one contiguous stretch of a call's prompt, paid at one rate. each call has up to four, in api
order: the cache-read span at the front, then the 5m cache-write span, then the 1h cache-write
span, then the raw-input span. the meter's three counts yield four spans because its one
cache-creation count splits by ttl. a held block is placed by its offset in the prompt, and pays
the rate of each span it overlaps.

## .refs
- src/domain.operations/reflect/tokens/getOneTokenRepaid.ts
- src/domain.operations/reflect/tokens/formatTokenSpendTree.ts

## .reason
- `term=transcript.call.span._.choice.reason.md` — etymology, disputes, evidence
