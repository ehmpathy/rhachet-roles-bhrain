import { jest } from '@jest/globals';

import { JEST_REPO_GLOBALS_KEY } from './jest.repo';

// every `when.repeatably` attempt checks the attempt-1 snapshot
import './src/.test/withAttemptAgnosticSnapshots';

/**
 * .what = the per-test budget of each live suite
 * .why  = an acceptance case is a blackbox drive of the real cli, and the review + route
 *         families spawn a real brain inside the timed block, often with a temp-dir clone and a
 *         `rhachet roles link` per role. 90s sits under that common case; 240s does not. a budget
 *         is a cap: a case that exits in 2s is untouched by it
 */
const BUDGET_OF_SUITE = { integration: 90_000, acceptance: 240_000 } as const;

/**
 * .what = the suite this env runs within, as `jest.repo.ts` stamped it into the globals
 * .note = runs after the practice env, so its budget overrides the practice's 90s default
 */
const { suite } = (globalThis as Record<string, unknown>)[
  JEST_REPO_GLOBALS_KEY
] as { suite: keyof typeof BUDGET_OF_SUITE };
jest.setTimeout(BUDGET_OF_SUITE[suite]);

/**
 * .what = retry a failed test up to twice, at once, and log each failure before the retry
 * .why  = a live brain varies run to run, so one slow or off ask reds a suite and blocks a
 *         release. `when.repeatably(SOME)` cannot rescue it: test-fns reports every failed
 *         attempt as a failed jest test (ehmpathy/test-fns#71). a jest-level retry absorbs the
 *         flake where the failure is counted, and it covers a jest timeout too
 * .note = a retry is never silent: `logErrorsBeforeRetry` prints each failure above its retry
 */
jest.retryTimes(2, { logErrorsBeforeRetry: true, retryImmediately: true });
