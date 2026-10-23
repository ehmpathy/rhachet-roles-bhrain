# fulcrum F100 — the live cache proof grades a best-effort host at EVERY

- rework = **clean** — one config constant in one test file; flip it back in one line
- status = 🟡 **BEST-GUESSED 2026-10-05 — option B: SOME for this suite alone, plus a premise check**
- confidence = 🟡 **82%**
- raised.by = self, at the 5.3 integration rerun

## .the cue that fired

the integration rerun read `stepReview.casePromptCache` red on attempt 1 of 3: round 2 billed
`inputCacheRead: 0` on a prefix identical to round 1's, while attempts 2 and 3 served **99.7%**.
under the repo's local `EVERY` criteria, one cold round fails the suite.

## .the cause, measured

- the default test brain (`…/flash/floor&speed=min100tps&privacy=full`) pins ONE host, no fallback
- 🔴 `rhachet-brains-openrouter` sends **no replica-affinity header** — no session pin at all
  (a grep of its `dist/` for `affinity|session` returns none). the cache suite was written when the
  test brain DID pin; the openrouter cutover (pass 31) removed the pin without a word
- ⇒ a warm round 2 is **best-effort at the host's replica pick**. a spy on `ask` now logs the served
  provider per round: a scoped re-probe read **3 of 3 warm, every round on CoreWeave**. today's tally
  on min100tps: **8 of 9 attempts warm**

## .the fork

| option | what it does | cost |
|---|---|---|
| A — keep `EVERY` | 3 of 3 must warm | at ~90% per attempt, **~27% of correct runs go red** — a flake by construction |
| **B — `SOME` here alone** ✅ | 1 of 3 must pass every claim; misses still logged with tokens + provider | a broken layout still reads **0 of 3** and goes red; a 1-in-3 layout defect would hide — but the layout is deterministic bytes, clamped at `EVERY` by the byte suites |
| C — re-send a missed round 2 | retries within an attempt | 🔴 weakens the claim: a retry can hit on its OWN fill, which proves an identical prompt repeats, not that a SHARED PREFIX does |
| D — the pin | a replica-affinity header from the package | the true cure, and it is not this repo's — reseeded to `rhachet-brains-openrouter` |

## .taken — B, and why at the time

the one quantity that varies across attempts is the provider's replica pick; our half (bytes, order,
system prompt) is fixed and clamped elsewhere at `EVERY`. so `EVERY` here grades the provider, not
the code. the premise check (`round 2 reached the same provider as round 1`) makes a host hop name
itself, so no future red reads as a layout defect.

## .why the confidence is low

- n = 9 attempts, one day, one host; the true per-attempt rate is unknown to ±15%
- it departs from `rule.require.repeatable-for-llm-tests`' local default, which a council may weigh
  above the arithmetic
- 🔴 the larger fact is the PRODUCT's: the default reviewer rides the same package, so its cache
  lever is best-effort too. that is D, and it is owed upstream

## .where

`src/domain.operations/review/stepReview.casePromptCache.integration.test.ts` —
`REPEATABLY_CONFIG_OF_LIVE_CACHE`, the `askSpy`, the premise `then`.
