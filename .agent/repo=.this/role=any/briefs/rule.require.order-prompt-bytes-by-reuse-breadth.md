# rule.require.order-prompt-bytes-by-reuse-breadth

> **order a prompt's bytes by how many requests will send those exact bytes — widest share
> first. reuse breadth is the first key, stability across rounds the second, size the third.**

a prompt cache serves the run of bytes a request shares with one already sent. so the bytes
that the most requests share must sit nearest token 0, and the bytes only one request sends must
trail. this generalizes `rule.require.order-prompt-sections-by-volatility-then-size`: volatility
is reuse across ROUNDS; breadth is reuse across the requests of ONE round. breadth leads, since
those requests land within seconds of each other — well inside any cache window.

## .the keys, in order

| key | what it counts | example |
|---|---|---|
| 1. **breadth** | requests this round that carry these exact bytes | the route spec rides all N partitions of a lane → share N. a partition's own files → share 1 |
| 2. **stability** | rounds these bytes survive unchanged | an old untouched file outranks one edited this round (`getAllTargetsByCacheStability`) |
| 3. **size** | mass at stake | among equals, the larger block leads |

⇒ **never let key 2 override key 1.** a shared spec file edited this round is newest by mtime,
so a stability-only sort puts it LAST — behind every partition's own files — and each partition
pays it in full. measured 2026-10-06: the shared spec was 200.8k of a 336.0k partition prompt,
re-sent at full price by nine partitions.

## .the corollary — prime, then pour

breadth only pays if the shared prefix is in cache before the peers arrive. N requests fired at
the same instant all miss. so: send ONE cheap request that carries the shared prefix (a poke —
max one output token), await it, then pour the rest concurrently. cost: one prefill of wall time.
gain: (N−1) × the shared mass, read at the cache rate.

## .the test

> **for each block: how many requests this round carry it byte for byte?** sort on that first.

| when… | then… |
|---|---|
| one request fans out into N that share a block | 🔴 that block leads all N, ahead of each one's own bytes |
| a sort keys on mtime, hash, or path alone | it is key 2 or worse. what is key 1? |
| N concurrent requests share a prefix | prime it with one request, then pour |
| a shared block is volatile across rounds | still leads within the round — breadth outranks stability |

blocker: a block shared by N requests placed behind a block unique to one · a fan-out of N
requests that share a prefix, fired with no prime.
nitpick: a breadth tie broken by aught but stability, then size.

⇒ see also: `rule.require.name-the-shared-prefix-as-the-cache-anchor` (the parent) ·
`rule.require.order-prompt-sections-by-volatility-then-size` (key 2, at section grain) ·
`rule.forbid.serial-reviews-that-could-pour` (why the prime is one request, not a serial loop) ·
`getAllTargetsOfPartition` (`src/domain.operations/review/partition/getAllTargetsOfPartition.ts` —
the shared spec leads each partition; the split it reads is `getAllTargetsByPartition`) · `getAllTargetsByCacheStability`
(key 2 within each group).
