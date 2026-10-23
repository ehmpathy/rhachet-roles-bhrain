# F260 — the eviction probe's live series stays a paid human run

- raised 2026-10-12, by `ergo-acceptance-journey-coverage` (blocker.1), at 5.3 i004
- rework: **clean** — one additive acceptance suite, gated on a key, if the council rules B
- status: 🟡 **BEST-GUESSED — disputed; the council rules on the paid series**
- confidence: **80%**

## .the fork, stated fairly

`probe.cache.eviction` has two halves. the hermetic half (`--help`, an unknown phase, `show` with
no calls, `poke` unarmed) is snapped in `blackbox/probe.cache.eviction.acceptance.test.ts`. the
live half — `arm`, then `poke` over the cache window, then `read`, then the verdict — is not.

| option | the claim |
|---|---|
| **A — the live series stays a documented human run** | the series spends live fireworks tokens across a 90-minute chain, and its verdict is a measurement of the provider's cache, not of our render. a CI case would charge every run and wait 90 minutes for one line |
| **B — drive the live series at acceptance grain** | `rule.require.acceptance-journey-coverage` names credential difficulty a blocker, not a deferral; the branch held its peer skill `census.review-shared-prefix` to a `...ViaRhx` suite |

## .taken, and why

**A**, plus the half of the concern that is free:

- the suite now spawns the skill BY ITS OWN PATH (`spawnSync(SKILL, input.args, …)`), never
  `bash <skill>`. a skill left at mode 644 now fails this suite, so the exec-bit regression class
  (R14) is clamped. the file is 100755 in the index
- the census peer is not a precedent for the series: `census.review-shared-prefix` reads logs
  already on disk and spends zero tokens, so its `...ViaRhx` suite costs naught. the probe's
  series is the opposite case — its only purpose is to spend tokens and wait out a cache window
- the verdict render is the one part a reviewer would pin, and it prints only after the paid
  series returns. a fixture that fakes the provider's timings would snap our formatter and prove
  naught about the journey the rule asks for

## .rework, and why

**clean.** a key-gated acceptance case is additive: one new suite, no caller hardened against
its absence. the council can order it at the close with no teardown.

## .confidence, and why it is not higher

the rule's text refuses cost as a ground, and this row asks the council to accept it anyway for a
90-minute paid chain. the exec-bit half is repaired, so only the paid series is in dispute.

## .where

`blackbox/probe.cache.eviction.acceptance.test.ts` · `.agent/repo=.this/role=any/skills/probe.cache.eviction.sh`

## .verdict

— (awaits the council)
