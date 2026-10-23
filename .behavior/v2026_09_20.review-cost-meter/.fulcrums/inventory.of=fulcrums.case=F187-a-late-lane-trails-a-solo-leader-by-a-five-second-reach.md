# F187 — a late lane trails a solo leader by a five-second reach

- raised 2026-10-08, from the i025 measure: every prime watermark read `peers: []`, `warm: false`.
  lanes reach the meet after their own compile, seconds apart, past the 1.5s gather, so each lane
  claimed the head afresh and went solo
- rework: **clean** — one option default (`MS_OF_REACH_DEFAULT`) in `genReviewPrefixPrime.ts`
- status: 🟡 **BEST-GUESSED — a lane that finds a recent cold release whose leader's own review
  carried the head (`sent: true`) trails it: it waits out the rest of a 5s reach from the release,
  then pours as `awaited`. no claim, no gather, no poke**
- confidence: **65%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — trail with a reach wait (5s)** | the leader's own review prefill gets a head start, so the late lane is likelier to land after the prefix is written |
| **B — trail with no wait** | zero wall time; the late lane pours at once and hopes the prefix is already written |
| **C — a longer gather** | every leader waits longer for peers; costs wall time on every lane, the lone ones too |

## .taken, and why

**A**, as an option with a default. a request that lands while the leader's prefill still runs
likely misses; B would reproduce today's miss for any lane that arrives within the prefill. C
taxes the common lone lane to serve the rarer pair.

## .rework, and why

**clean.** the reach is one option; set it to 0 for B, or tune it once a prefill time is measured.

## .confidence, and why it is not higher

- 5s is a guess, not a measured prefill time. a ~400k-token prefill may take longer, in which case
  some late lanes still miss (no worse than today)
- the whole lever is moot on a host that never caches — see F186; it pays only once the upstream
  rank lands on a host that caches

## .where

`src/domain.operations/review/prime/genReviewPrefixPrime.ts` (`genPartOfMeet` role `trail`,
`getOneGatherOfLeader`, the watermark's `sent` field) · clamp:
`genReviewPrefixPrime.integration.test.ts` `[case11]`, `[case12]`, `[case8]` re-aimed

## .verdict

(open)
