# F12 — the cache record's age is its file mtime, not a stored `at`

- **the fork:** the vision's `.the cache` names the record `{ line, route, fingerprint, at }` and
  the hit `fingerprint equal AND at younger than the max age`. (a) store `at` as the vision says ·
  (b) store no time; the age is the cache file's own mtime, set by the atomic rename that wrote it
- **taken:** (b). a stored stamp must be written and read in one clock and one format, and a
  repo rule forbids timestamps in route artifacts; the mtime is set by the write itself, so it
  can neither drift from the record nor be read in a second zone. the hit test is unchanged in
  sense: fingerprint equal AND younger than 30s
- **against:** an approved vision clause, departed from in its letter. the vision yield was not
  rewritten, so the departure is held here for the council, as F5 holds the `@src` clause
- **rework:** clean — `at` would be one field written and one read; the clamp `[case19]`
  (record keys exactly `fingerprint, line, route`) would flip with it
- **confidence: 85%** — the sense of the clause holds; only its mechanism moved
- **where:** `cache/getOneRouteStatusLineCache.ts`, `stepRouteStatusLineCached.ts`
  (`isCacheAgeWithinMax`), acceptance `[case19]`, integration `[case6b]`
