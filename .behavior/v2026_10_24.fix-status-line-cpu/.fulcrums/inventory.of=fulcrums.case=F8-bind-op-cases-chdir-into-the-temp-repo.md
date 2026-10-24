# F8 — the real bind op cases chdir into the temp repo, scoped

- **the fork:** `[case9]` of the cached-step integration drives the real `setRouteBind` /
  `delRouteBind`, which read `process.cwd()` by contract (every extant bind op does, and every
  extant bind test chdirs the same way). (a) a `withinTempRepo` helper that chdirs, runs, and
  restores in `finally` · (b) thread a `cwd` through every bind op
- **taken:** (a). (b) changes the input contract of every bind op and its cli callers — a
  ripple past this wish. the chdir is scoped to one serial jest file, restored in `finally`, and
  the temp repo is the gitroot the ops are meant to see
- **against:** `rule.forbid.cwd-outside-gitroot` (nitpick grade) and the order-dependence
  hazard of a process global
- **rework:** dirty for (b) — every bind op, its cli entry, and its tests; clean to keep (a)
- **confidence: 85%**
- **where:** `src/domain.operations/route/statusLine/stepRouteStatusLineCached.integration.test.ts`
