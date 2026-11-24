# F11 — defer the review-mark scrub in the jest envs

## .the fork

5.3 r010 found hook-mode tests non-hermetic: an ambient `RHACHET_REVIEW_SUBPROCESS=1` from a review clone silences `stepRouteDrive`, so `[t3]` and the drive hook suites read red inside a reviewer. options:

- **a.** scrub every `ENV_OF_REVIEW_CHILD` mark in the three `jest.*.env.ts` files in this pr
- **b.** catch it as a dream (`.dream/v2026_11_24.fix.tests-scrub-the-ambient-review-marks.md`); keep this pr on the budget lever

## .taken, why

b. a touches the shared test setup of every suite in the repo, outside the wish. this shell cannot set the mark, so the clamp cannot be proven red-then-green here. in a clean env (ci, a human's terminal) the suites pass: `setStoneAsPassed.exhausted` 55/55, `peer-mixed-verdict-replay` 8/8.

## .rework

clean: a lands as its own small pr, the shape is in the dream.

## .confidence, why low

85%: a reviewer could hold that a test a review clone cannot run is a gap this pr owns, since `[t3]` is new here. but the non-hermetic read predates this pr for every hook-mode suite (36 reds in extant `driver.route.drive*` files).

## .where

`jest.unit.env.ts`, `jest.integration.env.ts`, `jest.acceptance.env.ts`, `src/domain.operations/ENV_OF_REVIEW_CHILD.ts`, `stepRouteDrive.ts:85`

## .verdict

open.
