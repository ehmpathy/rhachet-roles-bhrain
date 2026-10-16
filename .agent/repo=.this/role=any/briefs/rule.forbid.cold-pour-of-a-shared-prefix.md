# rule.forbid.cold-pour-of-a-shared-prefix

> **never fire N ≥ 2 concurrent requests that share a prefix before one of them has written it
> to the cache.**

the forbid twin of `rule.require.prime-the-shared-prefix-before-a-pour`.

## .the shape it forbids

```
👎  await Promise.allSettled(partitions.map(run))            # all N cold → all N miss
👍  await prime({ prefix: shared }).catch(log)               # one poke, max one output token
    await Promise.allSettled(partitions.map(run))            # N read the prefix from cache
```

## .the cue

| when… | then… |
|---|---|
| a `Promise.all` / `allSettled` maps over requests built from one shared block (for a partition, the `common` field of `ReviewPartitionOfTargets` — the shared bytes) | 🔴 is there a prime above it? |
| a prime failure would throw out of the fan-out | forbidden too — a prime is an optimization; log it and pour |

blocker: a cold pour of N ≥ 2 requests that share a prefix · a prime whose failure blocks the pour.

⇒ see also: `rule.require.prime-the-shared-prefix-before-a-pour` (the require twin) ·
`rule.forbid.serial-reviews-that-could-pour` (the pour itself).
