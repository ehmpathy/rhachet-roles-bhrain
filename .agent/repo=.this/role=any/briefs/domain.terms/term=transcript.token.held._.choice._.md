# domain.term: held

term.chosen   = held
term.kind     = adj                  # a block held in context, from its arrival to its end
term.boundary = transcript.token
term.synonyms.forbidden:
- alive
- resident
- live

## .what
a context block with its tokens and its lifespan: the call it arrived at, and the call a compaction
ended it at (or none, if it is still in context). the inventory is the set of blocks held at the
last call; repaid is computed over every block ever held.

## .refs
- src/domain.objects/Reflector/TokenHeld.ts
- src/domain.operations/reflect/tokens/getOneTokenInventory.ts
- src/domain.operations/reflect/tokens/getOneTokenRepaid.ts

## .reason
- `term=transcript.token.held._.choice.reason.md` — etymology, disputes, evidence
