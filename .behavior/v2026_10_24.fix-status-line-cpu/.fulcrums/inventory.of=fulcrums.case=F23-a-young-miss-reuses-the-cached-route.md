# F23 — a young miss reuses the cached route while its own bind flag stands

- **the fork:** the vision says a change costs *"the render alone; no repo-wide glob while the
  bound route's flag still stands"*. (a) a miss runs the full bind lookup every time · (b) a miss
  renders the cached route when the record is younger than the max age and that route's own
  bind flag still stands, else it runs the lookup
- **taken:** (b), the vision's contract. the lookup is a `dot: true` glob over the whole repo, and a
  seat at work misses on every passage and meter row. one stat of the cached route's flag replaces
  it. an unbound record and an aged one still run the lookup, so a new bind and a hand-planted
  second flag are seen
- **against:** a second bind flag planted by hand beside the cached route now faults within the max
  age rather than on the next miss. a hit already trusts the cached route that long, so the bound
  does not widen; `route.bind.set` drops the cache, so a multi-bind made through it faults at once
- **rework:** clean — `getOneRouteForMiss` returns `getOneBoundRoute()` alone; integration `[case2]`
  flips to one lookup per miss and `[case9][t3]` drops its backdate
- **confidence: 85%**
- **where:** `statusLine/stepRouteStatusLineCached.ts` (`getOneRouteForMiss`),
  `statusLine/cache/isRouteStatusLineBindFlagPresent.ts`, integration `[case2]` and `[case9][t3]`
