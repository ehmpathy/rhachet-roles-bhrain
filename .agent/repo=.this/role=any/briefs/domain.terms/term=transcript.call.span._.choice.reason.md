# domain.term.choice.reason: span

## .etymology
`message.usage` reports three counts per call — cache read, cache creation, raw input — and the
api fills them front to back: the cached prefix first, the newly cached stretch next, the uncached
tail last. so the counts are not three buckets but three adjacent stretches of one prompt. `span`
names a stretch with a start and an end, which is what lets a block's offset decide its rate.

chosen over:
- `segment` — implies a cut the prompt never has
- `range` — reads as a numeric interval with no rate attached
- `region` — spatial, and loose about adjacency

## .disputes
### dispute: span order — raised 2026-10-02 — status: RESOLVED (read, then write, then input)
- claim      = the raw-input span might precede the cache write
- counter    = cache breakpoints mark the prefix that gets cached; uncached content can only
               follow the last breakpoint, so raw input is the tail
- resolution = read at the front, then write, then raw input

## .evidence
- clamped in `getOneTokenInventory.test.ts`: a 2,000-token block at the prompt tail on call 2 pays
  1,997 as a 5m write and 3 as raw input, then 2,000 as a cache read on call 3
