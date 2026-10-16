# F94 — the test brain util reads the latest map inline, not via the async pin

## .the fork, stated fairly

`rule.require.versionless-brain-defaults` says every `genContextBrain` call routes its choice
through `getOneBrainChoicePinned`. `src/.test/genTestBrainContext.ts` maps a `latest` choice
through `PINNED_BY_ANY_SLUG`, a frozen copy of the package's own `PINNED_BY_LATEST_SLUG`.

| option | what it costs |
|---|---|
| **A — keep the inline read** (taken) | a second site applies the map; the rule's letter names one |
| B — `await getOneBrainChoicePinned(...)` | `genTestBrainContext` turns async; 17 integration suites build `context = { brain: genTestBrainContext(...) }` at describe level, so each must move to a `useBeforeAll` read and every `context.brain` use beneath it |

## .taken, and why, at the time

**A.** the rule's harm is drift — a pin hand-typed in a constant that strands on retirement. A
carries neither half of that harm:

- the map is READ from the brains package, never re-declared. the version lives there alone
- the drift the reviewer names — a provider added to `PACKAGE_BY_PROVIDER` but not here — is
  clamped: `getOneBrainChoicePinned.test.ts` compares `PROVIDERS_OF_TEST_PIN` with
  `PACKAGE_BY_PROVIDER` and goes red until both name the same providers
- `getOneBrainChoicePinned` is async only for a dynamic import that keeps cli entries lean; this
  test util imports the package statically already

B is a 17-suite restructure of test setup for no behavior change, in a cost-meter diff.

## .rework

**dirty** — B ripples into every brain-backed integration suite.

## .confidence — 80%, and why it is not higher

the rule carves out no exception for a test util, and its false-positive clause names only a
deliberate byte-stable pin. the call that a clamp-backed read meets the rule's intent is mine.

## .where

`src/.test/genTestBrainContext.ts` · clamp: `src/domain.operations/brain/getOneBrainChoicePinned.test.ts`

## .verdict

🔴 **REVERSED 2026-10-05 — option B taken, conceded to peer lane r001.** the "dirty" estimate
overstated the ripple: each suite already awaited inside a hook, so the swap was one `await` per
call site. `genTestBrainContext` is now async and routes its choice through
`getOneBrainChoicePinned`; the inline map copy, `PROVIDERS_OF_TEST_PIN`, and the drift clamp
(`[case5]`) are deleted, since one site applies the map again.
