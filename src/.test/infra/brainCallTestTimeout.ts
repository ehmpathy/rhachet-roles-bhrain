/**
 * .what = the per-test jest bound for a test whose subject makes a real brain call
 *
 * .why = these suites assert correctness, never latency. production bounds a review brain
 *        call at PT21M (getOneReviewBrainCallTimeoutMsFromEnv), so a jest bound below the provider's
 *        healthy tail fails a correct answer on the clock.
 *
 *        measured 2026-10-05 (openrouter/deepseek/flash), one integration run:
 *        - identical inputs swung 70s → 344s across attempts (provider queue variance)
 *        - healthy stepReview calls ran 21–156s; four attempts crossed 180s and failed
 *        - healthy real-review tallies ran 70–354s; one crossed 360s and failed
 *
 *        under REPEATABLY_CONFIG's local 'EVERY' criteria, one slow attempt fails the suite,
 *        so the bound must clear the slowest healthy attempt with margin. 600s is ~1.7× the
 *        slowest measured (354s) and still far below the production bound, so a true hang
 *        surfaces here as a jest timeout long before production would cut it.
 */
export const BRAIN_CALL_TEST_TIMEOUT_MS = 600000;
