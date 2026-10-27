# F14 — a degraded line is cached with its row, and each hit prints that row again

- **the fork:** a render that degrades (a corrupt `reviewPeerMeters.jsonl` or `passage.jsonl` line)
  prints the plain stone line and one stderr row. (a) skip the cache write, so each repaint
  renders and logs · (b) cache the degraded line under its fingerprint, so a hit is silent ·
  (c) cache the line with its degrade row, and print that row again on each hit
- **taken:** (c). a ledger is append-only, so a torn line stays until a human repairs it, and
  under (a) that seat pays the full render each repaint: the cost the wish exists to remove, on
  the seats a killed process is most likely to leave. (c) keeps the signal every repaint, the
  same row the miss printed, and drops the render. the ledgers sit in the fingerprint, so a
  repair misses at once
- **against:** a degrade is still a fault in the vision's sense, and (c) caches it. the vision's
  uncached faults print no line at all, and a degrade prints one, so they are two classes
- **rework:** clean — skip the cache write when `degradeRow` is set in
  `stepRouteStatusLineCached`, and flip integration `[case7]` to two renders
- **confidence: 85%**
- **where:** `statusLine/stepRouteStatusLineCached.ts`, `statusLine/cache/getOneRouteStatusLineCache.ts`
  (`degradeRow`), integration `[case7]`, acceptance `[case13][t1]`
