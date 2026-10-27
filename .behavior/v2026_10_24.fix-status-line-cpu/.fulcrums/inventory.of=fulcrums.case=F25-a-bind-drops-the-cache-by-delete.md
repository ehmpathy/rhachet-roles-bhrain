# F25 — a bind drops the cache by delete, not by an epoch row in every fingerprint

- **the fork:** `route.bind.set` must make the next repaint show the new route. (a) delete the
  branch's cache file · (b) bump a stat-visible epoch file that every fingerprint names, so a
  record written by a miss that began before the bind carries the old epoch and misses at once
- **taken:** (a). one `rm` per bind, and the hit path stats naught extra
- **against:** a race. an unbound seat's miss runs the repo-wide glob, then fingerprints, renders,
  and writes. if the bind lands its flag and its `rm` while that glob walks past the flag's dir, the
  racer's write lands last: a blank line under a branch-only fingerprint, which cannot see the new
  flag. that seat shows blank until the record ages past the max age
- **why it holds:** the race is bounded by the 30s max age, the same bound a hit already holds for
  a hand-planted flag (F23). it needs a repaint whose glob straddles the bind's flag write and its
  `rm`, on an unbound seat, and the cost is a blank line, never a wrong one. (b) charges one stat
  to every hit of every seat, ~3 per second each, to close a window of one glob's duration once per
  bind. the vision's outcome is a hit that does no fresh work
- **rework:** clean — a `bind.epoch` file under the cache dir, `utimes` in `setRouteBind`, one row
  in `getOneRouteStatusLineFingerprint`, and the miss reads it before the glob. the `rm` goes
- **confidence: 75%** — the trade is a judgment of rare-and-bounded against a per-hit stat, and an
  epoch is the cleaner shape if the race is ever seen in the wild
- **where:** `bind/setRouteBind.ts`, `statusLine/cache/delRouteStatusLineCache.ts`,
  `statusLine/stepRouteStatusLineCached.ts` (`getOneRouteForMiss`)
