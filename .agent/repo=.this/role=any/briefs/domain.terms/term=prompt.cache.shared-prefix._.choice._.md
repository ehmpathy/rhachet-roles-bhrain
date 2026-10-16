# domain.term: shared prefix

term.chosen   = shared prefix
term.kind     = noun
term.boundary = prompt.cache   # the bytes two prompts have in common, from token 0
term.synonyms.forbidden:
- common prefix
- static head
- cacheable prefix
- prompt prefix
- preamble

## .what

a **shared prefix** is the run of bytes, from token 0, that two prompts have in common.

```ts
sharedPrefix: {
  chars: number;              // how far the run reaches
  sentAs: 'brief' | 'prompt'; // which message slot carried it
}
```

it is the one quantity that decides what a prompt cache can ever save, for two reasons that
compound:

- a cache serves **exactly** the shared run and not one byte more. so a static block placed
  behind the first variable byte is uncacheable, however static it is
- a cache lives on the **replica** that served the request, so the run must ALSO be what the
  replica pin is derived from — otherwise the prefix is perfect and lands somewhere cold

it is a property of a PAIR, never of one prompt. "this prompt's shared prefix" is not a figure
anyone can compute; "the prefix round 2 shares with round 1" is. the code reflects that:
`getOneSharedPrefixOverlap({ earlier, later })` takes two.

`promptHeadStatic` is the block a compiler emits to serve as one; the shared prefix is the
measured run two requests actually had. the two coincide only when the layout holds, which is
why the second is what gets clamped.

## .refs

where the term composes declared operations and artifacts:
- src/domain.operations/review/meter/getOneSharedPrefixByteCount.ts        # the instrument
- src/domain.operations/review/compileReviewPrompt.ts               # emits the head that serves as one
- src/domain.operations/review/meter/reviewPromptCacheAnatomy.test.ts  # the clamps
- .log/bhrain/review/$ts/metrics.compiled.json                      # `prompt.cacheable` — the most a shared prefix could reach
- .agent/repo=.this/role=any/briefs/rule.require.name-the-shared-prefix-as-the-cache-anchor.md

## .reason

see the ref-level cluster beside this choice:
- `term=prompt.cache.shared-prefix._.choice.reason.md` — etymology, the rejected synonyms, and
  the measured round that settled what the word must carry
