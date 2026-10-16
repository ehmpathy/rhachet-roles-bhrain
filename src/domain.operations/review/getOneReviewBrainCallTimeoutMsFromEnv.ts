import { asGuardPositiveInt } from '@src/domain.operations/asGuardPositiveInt';
import { getOneReviewTimeoutOverrideMs } from '@src/domain.operations/review/getOneReviewTimeoutOverrideMs';

/**
 * .what = the env var a wrapper subprocess hands its derived brain-call bound down through
 * .why = an internal channel, never a human knob. it is kept apart from the human's
 *        `RHACHET_REVIEW_TIMEOUT_MS` so that var always holds what the human set: a nested
 *        runner reads the human's value for its own subprocess bound, and an error that names
 *        the human's var reports a figure the human chose
 */
export const ENV_OF_REVIEW_BRAIN_CALL_TIMEOUT_MS =
  'RHACHET_REVIEW_BRAIN_CALL_TIMEOUT_MS';

/**
 * .what = resolves the bound on the brain call inside one review — 21 minutes by default
 * .why = prevents hung LLM calls from a wait with no end
 * .note = the INNER of two nested bounds. the outer bounds the review subprocess
 *         (`runOneReview.getReviewSubprocessTimeoutMs`), and when a subprocess wraps
 *         this call it hands down a bound derived strictly below its own
 *         (`getOneReviewBrainCallTimeoutMsFromSubprocess`) through `ENV_OF_REVIEW_BRAIN_CALL_TIMEOUT_MS`, so
 *         this one fires first and its clean `ReviewTimeoutError` reaches the human. a
 *         direct `rhx review` has no outer layer, so the human's value binds it as is
 * .note = precedence: the wrapper's derived bound, then the human's override
 *         (`getOneReviewTimeoutOverrideMs`, the one reader of RHACHET_REVIEW_TIMEOUT_MS), then
 *         the default
 */
export const getOneReviewBrainCallTimeoutMsFromEnv = (): number => {
  // the bound a wrapper subprocess derived and handed down, guarded like the human's knob
  const raw = process.env[ENV_OF_REVIEW_BRAIN_CALL_TIMEOUT_MS];
  const derived =
    raw !== undefined
      ? asGuardPositiveInt({
          raw,
          key: 'timeout',
          at: `env ${ENV_OF_REVIEW_BRAIN_CALL_TIMEOUT_MS}`,
        })
      : null;

  // else the human's override, else the default
  return derived ?? getOneReviewTimeoutOverrideMs() ?? 21 * 60 * 1000;
};
