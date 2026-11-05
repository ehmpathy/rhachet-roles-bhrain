# domain.term.choice.reason: price

## .etymology
`price` is the word the money glossary already speaks: the repo adopts `iso-price`, whose types and
operations are all `price*` (`IsoPrice`, `priceSum`, `priceMultiply`). a token sum at its rates is an
`IsoPrice`, so the concept takes the glossary's word rather than a second one.

chosen over:
- `cost` — the review subsystem's metrics already render `cost.estimate` and `cost.total`; a second
  sense here would overload it, and `cost` reads as the act of a spend as much as its amount
- `charge` — implies a provider bill, where this is an estimate from public rates
- `bill` — a document, not an amount

## .disputes
### dispute: price or tokens as the unit of a repaid row — raised 2026-10-02 — status: RESOLVED (price primary)
- recorded in full under `term=transcript.token.repaid._.choice.reason.md`; price leads, tokens
  sit beneath it, and an unpriced model renders `unpriced` with its tokens still shown

## .evidence
- discovery: the vision's price-led outcome; a cache read and a raw input token differ in price by
  10x, so only price ranks blocks by what they cost
- invariant: a price is never computed from a guessed rate — tokens at a null rate land in
  `unpricedTokens` (clamped in `asTokenPrice.test.ts`)
- composes: `TokenPriceSum`, `TokenPriceByKind`, `asTokenPrice`, `asTokenPriceSum`
