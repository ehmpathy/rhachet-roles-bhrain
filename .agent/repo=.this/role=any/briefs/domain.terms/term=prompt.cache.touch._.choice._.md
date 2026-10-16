# domain.term: touch

term.chosen   = touch
term.kind     = noun + verb     # the GENUS — any act that refreshes a prefix's residency
term.boundary = prompt.cache
term.synonyms.forbidden:
- hit               # forbidden only in this sense — the caller's act. the PROVIDER's served share is the hit rate (`term=prompt.cache.hit-rate`), a distinct concept
- access
- use
- visit

## .what

a **touch** is any act that refreshes a prefix's residency on a replica. it is the **genus**;
a `poke` is one of its two species.

| the species | who sends it | what it wanted |
|---|---|---|
| a **poke** | a prime, before a pour | residency, and no output |
| a **nominal review** | `rhx review` | a verdict — residency is a side effect |

both touch. under lru a read refreshes recency, and the provider cannot tell which of the
two it served — so no clock the caller keeps may tell them apart either.

## .why the genus needs a word: the cache reach is measured from the last touch

a prefix decays `MINUTES_OF_CACHE_REACH` after it was last touched, whichever species touched
it. so every clock that asks *"is this prefix still warm?"* is stated over the genus:

```
sinceTouch <  MINUTES_OF_CACHE_REACH  ⇒  warm — a read may hit
sinceTouch >= MINUTES_OF_CACHE_REACH  ⇒  cold — the prefix is re-paid in full
```

`sinceTouch`, never `sincePoke`. a real review is a touch, so it restarts the decay clock
exactly as a poke does.

## .refs

- `src/domain.operations/review/MINUTES_OF_CACHE_REACH.ts`            # the reach a touch races
- `src/domain.operations/review/meter/getOneMinutesElapsed.ts`        # the lapse since the last send
- `src/domain.operations/review/prime/poke/setOnePrefixPoke.ts`       # the poke species

## .reason

see the ref-level cluster beside this choice:
- `term=prompt.cache.touch._.choice.reason.md` — the etymology, and the dispute that freed the
  word from `poke`'s forbid list
