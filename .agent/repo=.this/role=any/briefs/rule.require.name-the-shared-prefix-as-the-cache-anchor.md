# rule.require.name-the-shared-prefix-as-the-cache-anchor

> **when you send many prompts that repeat a block, name that block the shared prefix — put
> it first, keep it byte-identical, and hand it to the brain as the system prompt.**

a **shared prefix** is the run of bytes, from token 0, that two requests have in common. a
prompt cache serves exactly that run and not one byte more, so the shared prefix is the only
quantity that decides what a cache can ever save you.

three obligations, and each one alone is worthless:

| # | the obligation | what it earns | what its absence costs |
|---|---|---|---|
| 1 | place it first — every static byte ahead of every variable byte | the prefix reaches as far as it can | bytes behind the first variable byte are uncacheable, however static |
| 2 | preserve it — byte-identical across requests, no conditional block ahead of it | the prefix survives round over round | one conditional line at the top voids the whole prompt behind it |
| 3 | pin it — hand it to the brain as the system prompt | the requests land on a replica that holds the cache | a serverless fleet hands each call an arbitrary replica; a perfect prefix meets a cold one |

## .why the third obligation is the one that gets missed

1 and 2 are about the prompt, so an author who thinks about the cache at all will reach them.
3 is about where the request is sent, which does not look like a prompt concern at all.

- a prompt cache lives on the replica that served the request, never in a shared store
- a serverless deployment hands each call to whichever replica is free
- so a repeated prefix lands on a replica that has never seen it, and the hit rate is zero
  while the prompt is flawless

the remedy is a replica-affinity pin, and a pin needs a key that names what the requests
share. a per-request or per-turn id pins perfectly and shares naught: every call earns its own
replica, and the rate stays at zero while the header looks correct.

so the key is derived from the system prompt — the one part of a request that repeats. that
makes the system prompt the load-critical slot: it is both the cheapest place to put a shared
prefix and the only place a pin can be derived from.

## .the shape it fails in — six hops, no buggy link

```
briefs: []  →  castBriefsToPrompt returns ''  →  '' is falsy  →  no system message
            →  affinity key is null  →  no affinity pin sent  →  arbitrary replica
```

measured here: a ~97% shared prefix that cached 0.0%. every hop was locally correct, and the
composition cached naught — an obligation nobody owns, between two components that each behave.
the full record, with the offsets and the after-repair figures:
`rule.require.name-the-shared-prefix-as-the-cache-anchor.example=the-review-prompt-with-no-pin.md`

## .the test

> **1. "what block do these requests share?"** — name it. cannot name one → no cache to win,
>    and the rule says naught about you
>
> **2. "does one variable byte sit ahead of it?"** — yes → every shared byte behind that one is
>    uncacheable. hoist it
>
> **3. "is that block the system prompt?"** — no → the missed obligation. a cache the request
>    cannot be steered to is a cache you do not have

| when… | then… |
|---|---|
| you build a prompt from a static rubric plus a variable subject | the rubric is the shared prefix. it leads, and it rides as the system prompt |
| you append a line only when a section is present | the sharpest cue. that line voids every static byte behind it — make it unconditional and let it read correctly either way |
| a static block sits below a variable one | hoist it. static blocks sort ahead of variable ones, always |
| you pass `briefs: []` and put it all in the prompt | an empty brief list is not "no briefs" — it is a system prompt of `''`, which is falsy, which is no pin |
| a cache hit rate is ~0% and the prompt plainly repeats | check where the request is steered before you re-read the prompt — `rhx review._.cost --of tree` totals it `by provider`. the prefix is usually fine |
| you would key a pin on a request id, a turn id, or a timestamp | it pins perfectly and shares naught. the key names what requests share |
| several callers share a system prefix | leave the key coarse. a replica holds many prefixes at once, so over-fragmentation costs more than it buys |
| you order a list of files into a prompt | order by what will still be identical next round (`getAllTargetsByCacheStability`), never alphabetically |

## .the boundary

| a violation | not a violation |
|---|---|
| a repeated block placed behind a variable one | a genuinely one-shot prompt with no peer to share with |
| a conditional block ahead of the shared prefix | a conditional block below every static one |
| a shared prefix left in the user message where a system slot exists | a brain with no system-prompt concept — say so, and why |
| a pin keyed on a value that makes a request unique | a coarse key that groups callers who share a prefix |

the line that parts them: would a second request have reused these bytes, and did the layout
let it? the rule fires on the gap between those two, never on the absence of a second request.

## .enforcement

blocker: a repeated prompt block placed behind a variable one · a conditional line above a
shared prefix · a shared prefix that never reaches the system prompt where one is available ·
an affinity key derived from a value that makes a request unique.
nitpick: a prompt layout with no clamp that pins where its prefix parts · a file list ordered
by a key uncorrelated with what changes next round.
false positive: a one-shot prompt · a brain with no system-prompt or pin concept, stated.

see also: `…example=the-review-prompt-with-no-pin.md` (the 2026-09-18 occurrence — the
six-hop chain in full, the byte offsets, and the 3.3% → 78.8% repair) ·
`research.review-cost-and-cache` (the full measurement, the rate card, and the cost drivers) ·
`rule.require.clamp-edge-cases` (ehmpathy/mechanic — why the anatomy test had to be red
first) · `getAllTargetsByCacheStability` (the order that keeps a tail stable).
