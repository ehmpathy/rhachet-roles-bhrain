# domain.term: rate

term.chosen   = rate
term.kind     = noun                 # the price of one token of one kind, for one model
term.boundary = transcript.token     # the spend of a transcript's tokens, call over call
term.synonyms.forbidden:
- tariff
- fee
- unit cost

## .what
the price of one token of one kind — raw input, output, cache read, cache write 5m or 1h — for one
model, read from that model's brain atom spec. a rate the spec lacks is null, and its tokens render
`unpriced`; a rate is never guessed.

## .refs
- src/domain.objects/Reflector/TokenRates.ts
- src/domain.operations/reflect/tokens/getAllTokenRatesByModel.ts
- src/domain.operations/reflect/tokens/asTokenRatesByModel.ts
- src/domain.operations/reflect/tokens/asTokenPrice.ts

## .reason
- `term=transcript.token.rate._.choice.reason.md` — etymology, disputes, evidence
