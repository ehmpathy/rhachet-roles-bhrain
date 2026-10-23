# F4 — `repaid` in tokens, or priced

- **fork**: tokens only · tokens + dollars from a price table
- **taken**: tokens only, cache read and cache write always shown apart (wish requirement 5). a
  price table is per model and per date, and would need its own source of truth to stay honest.
- **rework**: clean — a price column can be added beside tokens.
- **confidence**: 85%
- **where**: `1.vision.yield.md` · open question 7
- **verdict**: ruled by the wisher (seed S2) — **both**. tokens stay the measured figure; dollars
  render beside them as `[priced]`. the source of truth the taken half asked for already exists:
  each rhachet brain atom's `spec.cost.cash` (input · output · cache.get · cache.set, as iso-price,
  with a cited source), matched on the call's `message.model`. a model with no spec, or a rate the
  spec does not carry (the 1h cache write), is shown `unpriced` — never guessed.
