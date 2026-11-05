# domain.term: repaid

term.chosen   = repaid
term.kind     = adj                  # a block's tokens, repaid on each call it stays in context
term.boundary = transcript.token     # the spend of a transcript's tokens, call over call
term.synonyms.forbidden:
- rent
- carry
- rereads
- recurrent

## .what
the total a context block cost across every call it stayed in context: its tokens on each call,
split by the span each call paid them through — cache read, cache write (5m or 1h), or raw input —
and priced by that span's rate. a block that arrives once and stays for 100 calls is repaid 100
times.

## .refs
- src/domain.objects/Reflector/TokenSpendReport.ts
- src/domain.operations/reflect/tokens/getOneTokenRepaid.ts
- src/domain.operations/reflect/tokens/formatTokenSpendTree.ts

## .reason
- `term=transcript.token.repaid._.choice.reason.md` — etymology, disputes, evidence
