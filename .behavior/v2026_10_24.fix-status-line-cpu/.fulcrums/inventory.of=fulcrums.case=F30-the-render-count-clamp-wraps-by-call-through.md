# F30 — the render-count clamp counts renders by the cache file's inode

- **the fork:** the clamp must count how many times the render ran across unchanged repaints.
  (a) count via a `jest.mock` factory that wraps each real export in `jest.fn(actual)` · (b) count
  via a side effect (cache-file writes) · (c) inject the render through a context argument
- **taken first:** (a), on the ground that a call-through wrap replaces no behavior and that (b)
  could not observe the repo-wide bind lookup, which leaves no trace on disk
- **the counter, raised three times (5.3 i001, i002, i003):** the rule forbids an undocumented
  mock in an integration test, and its exception names service constraints, not a toolchain limit
- **reversed at i003, reworked:** (b) for renders, (c) for the one race clamp
  - every miss writes the cache by rename, so a new inode per repaint counts renders exactly.
    `repaintObserved` lstats the cache file before and after one repaint; `runRepaints` sums it
  - the mid-render race (`[case8]`) needs an act between the fingerprint and the cache write, so
    `stepRouteStatusLineCached` takes `context.renderRoute`, which defaults to the real render,
    loaded lazily. the clamp passes one that calls the real render, then appends a passage row
  - the lookup-count assertions are dropped. the lookup's cost stays clamped where it is
    observable: the module-graph clamp (acceptance `[case16]`) and the multi-bind fault cases
- **the spies beside it** (`execSync` in the branch read, `console.error` in `setRouteBind`) are
  spies over real calls, never mocks, and the rule permits them
- **rework:** clean — one context field, no caller passes it but the clamp
- **confidence: 90%** — the inode count is exact for a rename write; a write path that edits in
  place would break it, and `setRouteStatusLineCache` is rename-only by design
- **where:** `src/domain.operations/route/statusLine/stepRouteStatusLineCached.ts`,
  `stepRouteStatusLineCached.integration.test.ts`
