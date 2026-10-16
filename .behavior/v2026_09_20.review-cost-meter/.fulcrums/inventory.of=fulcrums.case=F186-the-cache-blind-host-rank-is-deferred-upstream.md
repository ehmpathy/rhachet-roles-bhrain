# F186 — the cache-blind host rank is deferred upstream, not worked around here

- raised 2026-10-08, from the i025 measure: every `openrouter/deepseek/flash` lane read
  `cache.get: 0`, served by Wafer, a host openrouter marks `supports_implicit_caching: false`. the
  upstream floor ranks hosts by sticker input rate alone, so it picks Wafer on every ask
- rework: **dirty** — the rank lives in `ehmpathy/rhachet-brains-openrouter`; any local cure is a
  second host policy beside the package's own
- status: 🟡 **BEST-GUESSED — defer upstream as a reseed dream; repair only the local half (the
  prime meet that never formed) this round**
- confidence: **75%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — defer upstream** | the rank is the package's; a reseed dream carries the measure and the clamp shape. this repo keeps the floor slug |
| **B — pin a host locally** | set the default review brain to a slug that admits only hosts that cache (the first-party host). an immediate cache lever, at a higher sticker input rate |
| **C — a local re-rank** | wrap the package's endpoint list and re-rank by expected billed cost inside this repo |

## .taken, and why

**A.**

- C is a second host policy beside the package's, the braided trail; the cure belongs where the rank lives
- B trades a measured cost for an unmeasured one: the first-party host's prompt rate is higher, and
  the hit rate it would reach is unmeasured here. a default changed on a guess is the move
  `rule.require.versionless-brain-defaults` warns against in kind
- the upstream code cites its own decision to rank by input alone; a change to it is that repo's
  wisher's call, with this evidence

## .rework, and why

**dirty** for B and C — each ripples into the default brain or into a wrapper every review call
passes through. A defers no code here.

## .confidence, and why it is not higher

- B might be the cheaper interim: a cached first-party host could undercut Wafer's full rate once
  the prime forms. `rhx review._.cost` could measure it in one round, at a real spend
- the hit rate on the first-party host for this prompt shape is unmeasured
- 🔴 measured 2026-10-08, round i028: the floor host costs WALL TIME too, not only cache. of four
  fresh l1 lanes on `openrouter/deepseek/flash`, two hit the 20-minute bound (r23 at 428.6k
  tokens, r26 at 475.0k) while two larger prompts finished (r25 at 502.1k in 755s, r11 at 553.8k
  in 870s). latency does not track prompt size, so a size-triggered split would not cure it; the
  variance is the host's. each timeout spends a full round and returns no verdict — a cost that
  weighs toward B

## .where

`.dream/v2026_10_08.reseed.openrouter-floor-ranks-by-sticker-input-and-picks-a-host-that-never-caches.md`
(symlinked at `dreams/`) · upstream `node_modules/rhachet-brains-openrouter/dist/.../getAllQualifiedEndpoints.js`

## .verdict

(open)
