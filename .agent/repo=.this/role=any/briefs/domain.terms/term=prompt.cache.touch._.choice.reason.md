# domain.term: touch — the reason

## .etymology

from `touch(1)`, the unix act that updates a file's **mtime** and changes no content. that is
the genus's sense exactly: *refresh recency, alter naught*.

the same borrowed word was rejected for `poke` and is right here, which is the whole
argument for a separate cluster. `poke`'s forbid list reads:

> touch — claimed by unix for a file-mtime act, and the false friend is close enough to
> mislead — `touch` creates where absent, a poke never creates

that objection is exact, and it binds one sense: `touch` creates, so it cannot name a send
that never creates. it says naught against a word for "the class of acts that refresh
residency" — where the mtime metaphor is not a false friend at all, but the correct one.

## .why the genus earns a word

the warm/cold question is unstatable without it. it must say:

> if **any act** sent this prefix within the cache reach, a read may still hit

and *"any act"* has two members that share no other name: a `poke`, sent by a prime for
residency alone, and a **nominal `rhx review`**, sent for a verdict, whose residency effect is a
side effect nobody asked for. with no genus the rule has to be written twice, and the second
clause is the one an author forgets.

## .the provider cannot part the species, so neither may the clock

under lru a read refreshes recency, and a replica has no idea whether the read it served was a
prime's poke or a driver's review. the two are indistinguishable at the only layer that
matters, so a clock that tried to count one and not the other would model a distinction the
cache does not make.

that is the strongest form of the argument: the genus is not a convenience of prose. it names
the grain at which the cache system actually operates, and a term that named only the species
would be a worse map of the territory (`def.domain-discovery` — the map is not the territory).

## .the rejected synonyms

| rejected | why |
|---|---|
| **hit** | names what the provider did — it served bytes from cache. a touch names what the caller did, and the two come apart: a poke that misses is still a touch, because the miss re-populates that replica and restarts its clock. to conflate them would make the ~1-in-5 miss look like a gap in coverage, when it is the opposite |
| **access** · **use** · **visit** | generic english, and each is silent on the one property that matters: that the act restarts a decay clock. `touch` carries it from the unix sense |

## .the dispute

dated 2026-09-24, recorded at `term=prompt.cache.poke._.choice.reason.md` beside its twin. it
and the `warmer` dispute share one shape, and that shape is the lesson:

> a forbid list that does not say which sense it binds will be read as total, and then
> violated by the first author who needs the other sense.

two words on one list, both rejected correctly for a narrow sense, both adopted for a wider
one that had no word. the repair is a qualifier on the list plus a cluster for the freed sense —
never a rename of code that was right.

## .see also

- `term=prompt.cache.poke._.choice._.md` — one species, and the dispute's home
- `src/domain.operations/review/MINUTES_OF_CACHE_REACH.ts` — the reach a touch races
