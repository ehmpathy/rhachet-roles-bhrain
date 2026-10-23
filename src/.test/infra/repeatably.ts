/**
 * .what = shared config for then.repeatably in flaky tests
 *
 * .why = criteria='SOME' everywhere: the test passes as soon as 1 of 3 attempts passes, and the
 *        later attempts are skipped once one has
 *   - a first attempt that passes costs one attempt, not three, so a suite of real-brain calls
 *     runs in a third of the time
 *   - external APIs (tavily, llms) have transient failures; a slow or faulty host on one attempt
 *     does not fail a run that a second attempt passes
 *   - the production tally already fails fast and retries a slow ask, so a local run need not
 *     demand every attempt to catch a slow host
 */
export const REPEATABLY_CONFIG = {
  attempts: 3,
  criteria: 'SOME',
} as const;
