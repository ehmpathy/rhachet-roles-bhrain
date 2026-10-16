# F84 — the blackbox suites keep their fireworks pin this round

- rework = 🟢 **clean** — a literal swap to `DEFAULT_TEST_BRAIN` per suite, plus a resnap; no prod contract moves
- confidence = 🟡 **80%**
- raised.by = the driver, at i054, when `review.by` acceptance returned 81 LLM-case failures, each `412 Account … suspended` from fireworks

## .the fork

the default brain moved to `openrouter/deepseek/flash`, and `DEFAULT_TEST_BRAIN` moved with it. ~25
blackbox suites still pass a literal fireworks slug, so a fireworks account outage fails them all.

| option | what it costs |
|---|---|
| A — swap every habit pin to `DEFAULT_TEST_BRAIN` now | ~25 suites and their snapshots, each re-run against a live brain to prove the swap — a ripple far past the cost-meter diff |
| B — defer with a dream, keep this stone on its subject | the pinned suites stay red until the fireworks account is restored or the dream lands |

## .taken — B

- the pins predate this branch; this branch only renamed `v4-flash` → `flash/latest` when the brains package renamed the slug
- the failures are an account state, not a code defect: every deterministic case in the same suites passes
- the swap is safe but not clean — it ripples into files this stone never opened (`rule.always.fix-forward-under-scouts-honor`)
- the work is caught: `dreams/v2026_10_03.fix.blackbox-suites-pin-a-provider-the-default-left.md`

## .why confidence is not higher

a reader may hold that a default cutover owes its test pins in the same change, since a stranded pin is
exactly the defect `rule.require.versionless-brain-defaults` names. that is a fair read, and the swap is
mechanical; the deferral rests on scope and the live-brain proof cost alone.

## .the part already landed

the two `review.by` suites — the ones a peer named, with their four absent snapshots — now pin
`DEFAULT_TEST_BRAIN`, and the `codebase-review-by` fixture carries `rhachet-brains-openrouter` so
the default resolves there. both suites were re-run against the live brain and resnapped. the
dream now covers only the suites left beyond those two.

## .verdict

✅ REVERSED 2026-10-03 to A — the swap landed in this stone, because 5.3's mandate is zero
failures and option B left ~200 red. what the swap took, all now in the diff:

- every blackbox habit pin reads `DEFAULT_TEST_BRAIN`; a grep for a literal provider slug under
  `blackbox/` returns zero
- the integration suites that pinned `fireworks/deepseek/flash/v4.1` by habit read it too, and the
  live prompt-cache suite measured the same zero-write cache on openrouter (27/27)
- 🔴 the swap alone made it WORSE (245 → 224 failed, a new cause): three fixtures
  (`codebase-mechanic`, `route-guard-review-by`, `route-optional-skip`) and two symlink sets
  (`invokeRouteSkill`, `driver.route.optional-skip`) lacked `rhachet-brains-openrouter`, so every
  temp repo refused `brain 'openrouter/deepseek/flash' is not registered`. a brain registers only
  where the fixture's package.json declares it AND the temp node_modules links it
- clamped by `src/.test/blackboxBrainLinks.integration.test.ts` — no literal slug, every linker and
  every brain-aware fixture carries the default provider; proven red with one fixture unlinked
- full acceptance went 224 failed → 0 failed

the dream is retired. F87's stated blocker (its proof suites sat behind this pin) is lifted; its
dirt call stands on its own grounds.
