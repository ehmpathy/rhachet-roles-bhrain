# domain.term: tier

term.chosen   = tier
term.kind     = noun
term.boundary = transcript.token
term.synonyms.forbidden:
- confidence
- precision
- grade
- level

## .what
how a held block's token count was known, from firmest to softest: `measured` (read off
`message.usage`), `exact` (the whole delta of one call landed on one block), `apportioned` (a
delta split across several blocks by byte share), `unattributed` (no block could claim it).

## .refs
- src/domain.objects/Reflector/TokenHeld.ts (`TokenTier`)
- src/domain.operations/reflect/tokens/getOneTokenInventory.ts

## .reason
- `term=transcript.token.tier._.choice.reason.md`
