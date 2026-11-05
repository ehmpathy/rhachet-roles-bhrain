# domain.term: inventory

term.chosen   = inventory
term.kind     = noun
term.boundary = transcript.token
term.synonyms.forbidden:
- breakdown
- composition
- makeup

## .what
the tokens a transcript's context held at its last call, summed per category — every token in
exactly one row, `unattributed` included, so no token escapes the count.

## .refs
- src/domain.objects/Reflector/TokenSpendReport.ts (`TokenSpendInventoryRow`)
- src/domain.operations/reflect/tokens/getOneTokenInventory.ts
- src/domain.operations/reflect/tokens/formatTokenSpendTree.ts (the `inventory` section)

## .reason
- `term=transcript.token.inventory._.choice.reason.md` — why this word, and its line against `itemization.inventory`
