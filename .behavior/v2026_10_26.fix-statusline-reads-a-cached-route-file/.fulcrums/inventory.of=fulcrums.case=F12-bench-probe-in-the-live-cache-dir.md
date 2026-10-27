# F12 — the bench clamp plants its probe in the live cache dir

- **the fork:** the clamp for the bench's narrow drop (bench case7) must show that a miss arm keeps
  a `branch=*.route` pointer. (a) plant a probe pointer in the cache dir the bench drops from, which
  is this repo's own, then remove it; (b) give the bench an injectable cache root and test it in a
  temp dir
- **taken:** (a). the bench measures this repo's real tree from the gitroot by design (case7: "a
  bench run from the gitroot, where the package is found"); its node arms import the package by
  name and render against the real route, so a temp dir cannot host them (case8 shows a temp dir
  fails at its first git arm). the drop is cwd-relative, so the live dir is the one place its real
  effect is observable. the probe is named for a branch that does not exist
  (`branch=bench.pointer-probe.route`), so no seat ever reads it; a `finally` removes it on every
  path; the `mkdirSync` is a no-op on the dir every linked repo holds, and that dir ignores itself
- **rework:** clean — the probe lives in one test case; an injectable root would be one flag on the
  bench and one case moved
- **confidence:** 90%. the doubt: an injectable root would let the clamp run hermetic. it would add
  a flag a human never passes, to a bench whose whole subject is the live tree
- **where:** `.agent/repo=.this/role=any/skills/bench.status-line.integration.test.ts` case7
- **raised by:** ergo-contract-snapshots, 5.3 i001 r002, nitpick.2 (its location names the
  acceptance file; the cited code is the bench test)
