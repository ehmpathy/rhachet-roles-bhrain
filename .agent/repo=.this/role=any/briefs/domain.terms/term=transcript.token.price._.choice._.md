# domain.term: price

term.chosen   = price
term.kind     = noun                 # a token count at its rates, as money
term.boundary = transcript.token     # the spend of a transcript's tokens, call over call
term.synonyms.forbidden:
- cost
- charge
- bill

## .what
the money a set of tokens cost: each kind of token times its rate, summed. carried as an
`IsoPrice`, with the tokens no rate could price held beside it as `unpricedTokens`, so a reader
sees the priced part and what was left unpriced.

## .refs
- src/domain.objects/Reflector/TokenSpendReport.ts (`TokenPriceSum`, `TokenPriceByKind`)
- src/domain.operations/reflect/tokens/asTokenPrice.ts
- src/domain.operations/reflect/tokens/asTokenPriceSum.ts

## .reason
- `term=transcript.token.price._.choice.reason.md` — etymology, disputes, evidence
