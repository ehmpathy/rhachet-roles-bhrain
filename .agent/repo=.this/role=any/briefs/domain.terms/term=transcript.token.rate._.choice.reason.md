# domain.term.choice.reason: rate

## .etymology
a rate is a price per unit. the unit here is one token of one kind, and the kinds differ in price
by up to 40x — a cache read costs a tenth of a raw input token. so the per-token price is never one
number per model; it is five, and `TokenRates` holds all five beside the model they price.

chosen over:
- `tariff` — a schedule of charges, which names the whole table rather than one entry in it
- `fee` — a flat charge per event, never per unit
- `unit cost` — two words for one concept, and `cost` already reads as a sum

## .disputes
none raised.

## .evidence
- discovery: the brain atom spec carries `cost.cache.get`, `cost.cache.set` and `cost.input`/
  `cost.output` per model; each maps to one rate here, and the 5m/1h write split is a multiple of
  the base input rate
- invariant: a rate absent from the spec is null, and `asTokenPrice` counts its tokens as
  `unpricedTokens` rather than price them at zero (clamped in `asTokenPrice.test.ts`)
- composes: `TokenRates`, `getAllTokenRatesByModel`, `asTokenRatesByModel`
