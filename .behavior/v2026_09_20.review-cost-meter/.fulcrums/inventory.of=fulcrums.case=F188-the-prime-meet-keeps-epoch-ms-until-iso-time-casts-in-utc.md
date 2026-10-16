# F188 — the prime meet keeps epoch ms until iso-time casts in utc

- raised 2026-10-09, from i028 r031 nitpick.2: the meet records `primedAt`, `msOfStop`, `msOfGiveUp`
  and its `MS_OF_*` windows as bare epoch ms or ms durations, across eight leaves and the persisted
  prime watermark (`rule.forbid.any-time`)
- rework: 🔴 **dirty** — eight leaves, the persisted watermark shape (a lane of the prior shape reads
  a torn record), and every meet test that drives sub-second windows
- status: 🟡 **BEST-GUESSED — the meet keeps epoch ms; the move waits on the upstream cast**
- confidence: **80%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — move now** | one time dialect across the review domain; the unit is in the type, never in a name |
| **B — keep epoch ms, defer** | the meet's windows are sub-second and its stamps must name the true instant; the cast that would carry them does neither today |

## .taken, and why

**B.** the meet's windows run in hundreds of ms (a 400ms deadline in `[case13]`, a 1.5s gather).
`asIsoTimeStamp` in `iso-time@1.11.1` drops milliseconds and renders local wall time behind a literal
`Z` (`dreams/v2026_10_08.reseed.iso-time-stamps-local-time-with-a-utc-z.md`). a stamp cast through it
would round every window to a whole second and shift `primedAt` by the host's utc offset, so a lane
on a non-utc host would read a fresh claim as hours stale, or a stale one as fresh. the epoch-ms
comparison is confined to the meet's own leaves and its watermark, which no other surface reads.

## .rework, and why

**dirty.** the watermark is persisted, so the move changes a stored shape that a concurrent lane of
the prior shape would read as torn. it is a migration, not a rename.

## .confidence, and why it is not higher

- `IsoDuration` would carry the windows without the skew; only the stamps hit the cast defect. a
  split move (windows now, stamps later) is possible and was not weighed in full
- once the upstream cast renders in utc with ms, the move is clean in substance and only the
  watermark shape remains

## .where

`src/domain.operations/review/prime/meet/*` · `prime/genReviewPrefixPrime.ts` ·
`prime/meet/PrimeWatermark.ts`

## .verdict

(open)
