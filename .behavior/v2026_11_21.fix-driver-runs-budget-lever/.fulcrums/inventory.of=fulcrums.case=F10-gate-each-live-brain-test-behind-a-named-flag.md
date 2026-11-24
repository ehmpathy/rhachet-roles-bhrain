# F10 — gate each live-brain test behind a named flag

## .the fork

a host with no llm keys must run the default integration and acceptance selection to a green verdict. options:

- **a.** one declared list of suites, cut via `testPathIgnorePatterns` off a live run; ci (`CI=true`) runs all
- **b.** the paved shape (`genReviewBrainSupply`, `stepReview.caseBrain.claude-sonnet`, `stepReview.casePromptCache`): each live-brain block runs only where a named `BHRAIN_TEST_LIVE_<X>=1` flag targets it, its header states the flag and the run command; keyrack sources strictly only when a flag is set

## .taken, why

b, by the foreman's verdict. it reuses the pavement rather than braid a second gate beside it, and the gate sits at the `given` grain, so every keyless `given` in a mixed suite still runs (a whole-file cut would drop 392 keyless acceptance tests and 229 keyless integration tests).

the gated set is measured: a keyless run of all 153 acceptance suites, and of every integration suite that names a brain or a key, failed in these givens at a brain call or key read. two givens in that red set failed for another cause, `review.by.dispatch` `[case-rhx1]` and `[case-rhx2]`: this host's rhachet `1.53.0` reads the passthrough `--role` at dispatch (host drift, below the diff). they make no brain call, so they stay ungated. four flags: `BHRAIN_TEST_LIVE_BRAIN_REVIEW`, `…_BRAIN_TALLY` (extant), `…_BRAIN_REFLECT`, `BHRAIN_TEST_LIVE_KEYRACK_FIREWALL`.

## .ci keeps the real-provider coverage

ci holds the keys (the `keyrack firewall` step exports them before the tests). so `.github/workflows/.test.yml` sets all four flags as job env on `test-shards-integration` and `test-shards-acceptance`, and every gated given runs against the real provider in ci, as before the gate. a keyless host runs green; ci with keys runs the full set; a flagged run with absent keys still refuses at setup (`keyrack.source` `strict`).

`BHRAIN_TEST_LIVE_BRAIN_TALLY` also turns on the extant `genReviewBrainSupply` live call in ci: one tally call that reds when the provider is dead. `…_SONNET` and `…_CACHE` stay opt-in.

## .rework

clean: drop the job env to return to opt-in only; no test change.

## .confidence

90%: the shape is paved, the set is measured, and ci runs the gated set with its keys.

## .where

- `src/.test/isLiveBrainTestRun.ts` (+ test), `jest.integration.env.ts`, `jest.acceptance.env.ts`, `jest.brain.globalSetup.ts`
- `.github/workflows/.test.yml` (the two shard jobs)
- the 31 gated suites, each with its flag header

## .verdict

settled: b, per the foreman; ci sets every flag (peer i002 r002, r003, r004).
