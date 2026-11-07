# feat: mark the system prompt with `cache_control`, so a repeated system prompt is read from the prompt cache

## .what

`rhachet-brains-anthropic@0.4.3` sends the system prompt as a bare string and sets no `cache_control` breakpoint. anthropic's prompt cache serves only content behind an explicit breakpoint, so an ask on an anthropic brain never reads a cache, however long and repeated its system prompt.

- `dist/domain.operations/atoms/genBrainAtom.js:42` — the system prompt joined from `role.briefs`
- `dist/domain.operations/atoms/genBrainAtom.js:88-96` — `system: systemPrompt`, a string, no `cache_control` block
- grep of the installed dist for `cache_control`: 0 matches

## .why it matters

`rhachet-roles-bhrain` carries a review's shared corpus as the system prompt, so the lanes of a guard level, and a prime poke ahead of them, send it byte for byte. on an anthropic brain none of it is ever read from cache, so every lane pays it at the full input rate.

## .the shape of the fix

- send `system` as a content-block array: `[{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }]`
- leave the user message unmarked; its bytes vary per ask
- report `cache_creation_input_tokens` as `cache.set` and `cache_read_input_tokens` as `cache.get` in the token cast, so a caller's meter reads both

## .how to verify

two asks with one system prompt above the model's minimum cacheable length, seconds apart: the first reports `cache.set` near the system prompt's tokens, the second reports `cache.get` near them.

## .source

found in `ehmpathy/rhachet-roles-bhrain` route `.behavior/v2026_11_01.fix-review-input-cacheability` (cause C7). no review lane defaults to an anthropic brain today, so this is a latent loss, not a live one.
