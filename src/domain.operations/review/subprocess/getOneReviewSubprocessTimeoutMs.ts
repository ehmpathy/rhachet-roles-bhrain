import { type IsoDuration, toMilliseconds } from 'iso-time';

import { getOneReviewTimeoutOverrideMs } from '@src/domain.operations/review/getOneReviewTimeoutOverrideMs';

/**
 * .what = the bound on the review subprocess, from its IsoDuration
 * .why = enables per-review timeout configuration
 * .note = the OUTER of two nested bounds; the brain call inside it is bound by
 *         `getOneReviewBrainCallTimeoutMsFromEnv`, handed a value strictly below this one
 * .note = the override is read by `getOneReviewTimeoutOverrideMs`, the one reader of
 *         RHACHET_REVIEW_TIMEOUT_MS; this bound adds only its own default
 */
export const getOneReviewSubprocessTimeoutMs = (input: {
  timeout: IsoDuration;
}): number => getOneReviewTimeoutOverrideMs() ?? toMilliseconds(input.timeout);
