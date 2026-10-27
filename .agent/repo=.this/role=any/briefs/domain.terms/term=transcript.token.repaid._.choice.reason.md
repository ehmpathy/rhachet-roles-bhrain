# domain.term.choice.reason: repaid

## .etymology
a stateless model re-reads its whole context on every call. a block is paid for once when it
arrives, then paid again on each later call — so the cost of a block is the arrival plus every
repayment. `repaid` names the recurrence directly, and it is the quantity a compression saves:
cut a block and every future repayment goes with it.

chosen over:
- `rent` — reads as a time charge; the charge here is per call, never per minute
- `carry` — names the hold, not the cost of the hold
- `rereads` — true only of the cache-read span; a block also pays as a cache write and as raw input
- `recurrent` — names the shape, not the sum

## .disputes
### dispute: tokens or price as the unit of repaid — raised 2026-10-02 — status: RESOLVED (price primary, tokens beside)
- claim      = tokens are measured and need no rate, so repaid in tokens is exact
- counter    = a token read from cache costs a tenth of a raw input token and an eighth of a
               5m write; a token sum ranks a block by volume, never by what it cost. only price
               knows the span
- resolution = repaid renders price first, the span split in tokens beneath it; a model with no
               spec renders `unpriced` with its tokens still shown

## .evidence
- discovery: walked the per-call prompt as three spans in api order — cache read at the front,
  then cache write, then raw input — and placed each held block by its offset in that prompt
- invariant: the repaid tokens of all blocks sum, per call, to that call's context (± the
  integer remainder of the apportionment), clamped in `getOneTokenInventory.test.ts`
- live: on a 428-call session, `boot.md` was repaid 122.7M tokens — 70.9% of all repaid
