# domain.term: meet

term.chosen   = meet
term.kind     = noun        # also a verb: "the lanes meet"
term.boundary = prompt.cache  # where the lanes of one pour decide who warms their shared head
term.synonyms.forbidden:
- rendezvous
- barrier
- handshake
- sync

## .what

a meet is the moment the lanes of one guard pour gather on a watermark, keyed by brain and
head, before any of them asks the brain. one lane wins the claim and sends the poke
(`prompt.cache.poke`); the rest wait for its release, then pour and read the head from cache.

a meet has one outcome per lane, and the outcome is what the meter reads
(`ReviewRunMeet`, recorded in `metrics.realized.json` `meet`):

| outcome | the lane | warm? |
|---|---|---|
| `primed` | held the claim, found a peer, and sent the poke | yes |
| `awaited` | found the head warm — a peer released it warm, or a recent release is | yes |
| `solo` | held the claim and found no peer; sent no poke | no |
| `cold` | a peer held the claim and released it with no prime behind it | no |
| `faulted` | held the claim; the poke or the watermark store failed | no |
| `timeout` | a peer held the claim and never released it in time | no |
| `expired` | the lane's deadline left the meet no time; it took no claim | no |
| `skipped.partition` | a partition run; its split lane primed its own common prefix | — |
| `skipped.lone` | a lone run; no pour, so no peer | — |

a warm meet (`primed`, `awaited`) means the head was in cache when the lane asked. so a zero
cache read after one is a **miss**, never the clock, whatever the lane's own prior round.

## .refs

- src/domain.objects/Reviewer/ReviewRunMeet.ts                       # the outcome, and `isRunMeetWarm`
- src/domain.objects/Reviewer/ReviewPrefixPrimeOutcome.ts            # the outcomes a joined meet settles to
- src/domain.operations/review/prime/genReviewPrefixPrime.ts        # the meet itself
- src/domain.operations/review/prime/getOneReviewRunMeet.ts         # skips included
- src/domain.operations/review/meter/asReviewRunMeetOfRealized.ts   # the one read off disk

## .reason

- `term=prompt.cache.meet._.choice.reason.md`
