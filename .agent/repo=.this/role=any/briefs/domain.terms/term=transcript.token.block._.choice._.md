# domain.term: block

term.chosen   = block
term.kind     = noun
term.boundary = transcript.token
term.synonyms.forbidden:
- chunk
- segment
- fragment
- part

## .what
one model-visible piece of text a transcript record adds to the context — a tool result, a hook's
output, a reminder, a human's words — with its category, its label, and the bytes the model saw.

## .refs
- src/domain.objects/Reflector/TokenBlock.ts
- src/domain.operations/reflect/tokens/asTokenBlocks.ts
- src/domain.operations/reflect/tokens/asTokenAllocation.ts

## .reason
- `term=transcript.token.block._.choice.reason.md`
