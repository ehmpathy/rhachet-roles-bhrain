# F18 — each sync fs call keeps its own absence catch; the allowlist is one predicate

- **the fork:** five sync fs reads in the cache layer each catch, return null on absence, and
  rethrow the rest. (a) one sync helper in `src/utils/fs/` that wraps them · (b) a catch per call,
  each gated on the shared `isErrorOfAbsence`
- **taken:** (b). the five calls are three different fs ops (`readFileSync`, `statSync`,
  `readdirSync`) with three return shapes, so a helper is a generic wrapper over a callback. the
  allowlist the failhide rule cares about already has one home: `isErrorOfAbsence`. to widen it,
  one must edit that predicate or write a second, which review sees
- **against:** five catch blocks of the same shape; a sixth could be written without the predicate
- **rework:** clean — a `withAbsenceAsNullSync(logic)` and five call sites
- **confidence: 80%**
- **where:** `cache/getOneRouteStatusLineBranch.ts`, `cache/getOneRouteStatusLineFingerprint.ts`,
  `cache/getOneRouteStatusLineCache.ts`, `src/utils/fs/isErrorOfAbsence.ts`
