# F6 — the shared repeatably criteria is `SOME` in every environment

## .the fork
- A: `criteria: 'SOME'` everywhere — a test passes when one of its 3 attempts does
- B: keep `process.env.CI ? 'SOME' : 'EVERY'` — a local run demands all 3 attempts
- C: `SOME` for the suites that call the slow tier, `EVERY` for the rest

## .taken
A. the wisher ruled it: make it `SOME` instead of `EVERY`, since a slow attempt already fails fast at
its test timeout and the next attempt runs. `SOME` stops at the first pass, so a healthy suite pays for
one attempt where `EVERY` pays for three.

## .why the old intent does not carry over
`EVERY` caught an intermittent bug by demand that all 3 attempts agree. on `openrouter/deepseek/flash`
the intermittent cost is the host behind the tier: it answered in 36s to 180s per ask on a 2k-token
tally, so `EVERY` tripled a run that already sat near its timeout. the full integration run measured
about 1550s under `EVERY` and 463s under `SOME`. a bug in this repo's own code still fails all 3
attempts, and `SOME` still reds the suite.

## .rework
clean — one constant in `src/.test/infra/repeatably.ts`. a council that prefers B restores one line.

## .confidence
90%. the residual doubt is the one the reviewers named: `SOME` can pass a test whose second attempt
would have failed, so a rare intermittent defect reaches CI unseen.

## .where
`src/.test/infra/repeatably.ts`

## .raised
i001 r002 and r004 graded it a blocker (`rule.forbid.test-intent-violations`). the change is a
requirement ruled by the wisher, not a silent relaxation; the release note carries it.

## .verdict
ruled — by the wisher
