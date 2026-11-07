# feat: a replica affinity pin keyed on the model and the system prompt, so a shared prefix meets the replica that cached it

## .what

`rhachet-brains-openrouter@0.1.4` sends no affinity key and no `cache_control` on an ask. each ask goes to the cheapest qualified host, and which replica serves it is arbitrary. so two asks that share a long system prompt, seconds apart, meet one cache by chance.

grep of the installed dist for `affinity`, `session_id`, `cache_control`, `sha256`: 0 matches.

- `dist/domain.operations/atom/genBrainAtom.js:149-165` — the ask body, no pin and no session key
- `dist/infra/cast/asOpenRouterMessages.js:12-26` — the system message, no `cache_control` part
- `dist/domain.operations/atom/getOneFloorCompletion.js:26-33` — the host choice, cheapest first, with no affinity

## .why it matters

`rhachet-roles-bhrain` now leads every review prompt with the corpus a guard level shares (instructions, output format, target files), carried as the system prompt. nine lanes over one corpus compute one byte-identical system prompt, and a prime poke writes it to the cache before the lanes pour. without a pin, each lane lands on whatever replica is free, so the read is likely, not certain. measured with no pin: ~39% of lanes met the primed replica over one six-lane level.

## .the shape of the fix

- derive a key from the model slug and the system prompt only — never the user prompt, the episode, or the tool defs, so asks that share a system prompt share a key
- send it as openrouter's session / affinity field on every ask (and on the host choice, so the floor prefers the host that served the key last, where it still qualifies)
- for providers behind openrouter that honor `cache_control`, mark the system message ephemeral
- keep the key coarse: a replica holds many prefixes, and a per-request key pins perfectly and shares naught

## .how to verify

two asks on one model with one 50k-char system prompt, two seconds apart: the second reports `cache.get` near the system prompt's tokens, on every run.

## .source

found in `ehmpathy/rhachet-roles-bhrain` route `.behavior/v2026_11_01.fix-review-input-cacheability` (cause C2).
