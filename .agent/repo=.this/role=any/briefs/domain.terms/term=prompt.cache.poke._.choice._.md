# domain.term: poke

term.chosen   = poke
term.kind     = noun + verb
term.boundary = prompt.cache   # one replay of a prefix, sent to keep it resident
term.synonyms.forbidden:
- warm              # names a temperature, never the act performed on it
- keep-alive        # names a strategy, never one send
- ping
- touch             # the act only — `touch` names the genus, and is canonical there
- refresh

## .what

a **poke** is one replay of a cache prefix, sent for residency rather than for output.

```ts
poke: {
  prefix: string;   // the bytes replayed — carried in the system slot
  maxTokens: 1;     // a poke buys residency, never a completion
}
```

three properties define it, and each parts it from a neighbour:

- **it buys no output.** `max_tokens: 1`. a call that wants an answer is not a poke
- **it is one act, never a schedule.** a prime sends exactly one, before a pour, so the N
  peers that follow read the shared prefix from cache
  (`rule.require.prime-the-shared-prefix-before-a-pour`)
- **it is an ordinary completion.** the provider exposes no cache-write surface, so a poke
  writes the prefix the way any call does — by a send — and a later poke of the same prefix
  HITS and bills at the cache rate

## .a poke sends a HEAD. it becomes a PREFIX only if the next round agrees

a poke is one prompt. a shared prefix is a property of a pair. so the act and its payoff sit
on opposite sides of a gap no single call can close:

| | what it is | decided when |
|---|---|---|
| what a poke sends | a head — bytes a compiler emits to serve as a prefix | at send |
| what a poke buys | the run the next round shares with it | one round later |

a poke that never becomes a shared prefix is a head sent to no one — it spends at cache rate
and protects no bytes. so a prime owes a prediction clamp: the head it sends must be asserted
against the prefix its peers realize, or it is a guess.

## .the arg is `prefix`

the api surface is `brain.cache({ prefix })`, never `{ head }` and never `{ sharedPrefix }`:

- not `head` — `promptHeadStatic` is a narrower, marker-cut block (102.7k in the largest
  measured prompt); the run worth a poke reaches past it into the stable target span
- not `sharedPrefix` — inside a `brain.cache` boundary the qualifier earns no clarity, and
  the caller supplies one prompt's bytes, never a measured pair

## .refs

- `src/domain.operations/review/prime/poke/setOnePrefixPoke.ts`  # the poke act
- `.dream/v2026_09_24.feat.a-prefix-keep-alive-could-halve-the-bill-if-eviction-is-lru.md`
- `term=prompt.cache.shared-prefix._.choice._.md`              # what a poke aims to become

## .reason

see the ref-level cluster beside this choice:
- `term=prompt.cache.poke._.choice.reason.md` — etymology, the rejected synonyms, and the
  exchange that settled it
