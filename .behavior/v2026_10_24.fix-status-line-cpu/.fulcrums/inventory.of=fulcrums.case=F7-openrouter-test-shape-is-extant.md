# F7 — the openrouter admitted-set test keeps its extant shape

- **the fork:** this pr touches `src/.test/openrouterAdmittedSetFallback.test.ts` only to follow
  the 0.1.3 → 0.1.4 re-pin (F4): the hop's expected `provider` moved from
  `allow_fallbacks: true, only: [a, b]` to `allow_fallbacks: false, only: [b]`, which is the
  0.1.4 behavior. reviewers ask further: (a) import via a public subpath, not `dist/…` · (b) add a
  real openrouter call beside the stub · (c) snap each send variant · (d) leave the test's shape
  as it stands on `origin/main` (since #628) and change only what the re-pin moved
- **taken:** (d). the deep `dist/` import, the fake client, and the field matchers all sit on
  `origin/main` already. the package exports no public path to that operation, so (a) is a
  change owed upstream. (b) cannot provoke a named-host 429 on demand against the live service,
  which is the one path the test clamps. (c) is cheap, but widens an extant suite outside the
  wish's bounds. the two cast notes gained a removal path, which the re-pin made a fair touch
- **the changed expectation:** 0.1.4 drops the throttled host from `only` on a hop and keeps
  fallbacks off, so the sticky cache holds — the behavior the local patch carried, now upstream
- **the evidence the expectation moved upstream, read at 5.3:** in the installed 0.1.4,
  `dist/domain.operations/supply/asProviderPreference.js` returns `allow_fallbacks: false`
  beside `only`, and `asHostFault.js` reads the host a fault names from `metadata.provider_name`.
  the old `allow_fallbacks: true, only: [a, b]` was the 0.1.3 LOCAL patch, deleted by the re-pin
  that cured `ERR_PNPM_UNUSED_PATCH` at boot, so the prior assertion has no code left to hold it.
  the case was retitled to the behavior it now pins, and the unmarked-429 row was added as its
  own case
- **a real openrouter call:** the live-brain acceptance suites (`review.by.*`,
  `review.representative-clean`, the driver peer lanes) send real asks through this same package
  on every full run, so the real contract is exercised; what no live call can do is provoke a
  named-host 429 on demand, which is the one branch this unit file clamps
- **rework:** clean — each of (a)–(c) is a local test edit or an upstream export
- **confidence: 85%**
- **where:** `src/.test/openrouterAdmittedSetFallback.test.ts`, `package.json` (pin + patch)
