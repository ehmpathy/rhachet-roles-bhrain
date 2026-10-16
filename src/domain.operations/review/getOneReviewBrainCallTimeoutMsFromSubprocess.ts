/**
 * .what = derives the brain-call bound from the subprocess bound that wraps it
 * .why = two nested layers bound one review: the subprocess (`runOneReview`) and the
 *        brain call inside it (`stepReview`). were the two bounds equal they would race,
 *        and the outer kill usually won — so the inner `ReviewTimeoutError`, the one with
 *        a clean message and exit 1, never showed. the inner bound sits strictly below the
 *        outer, by a tenth of it and at most one minute, so the inner always fires first
 *        and leaves the subprocess time to report it (raised i041/r027)
 * .note = floored at 1ms, since a bound of zero would fire at once. a subprocess bound of
 *         1ms is the one case where the two cannot part, and no real review runs in it
 */
export const getOneReviewBrainCallTimeoutMsFromSubprocess = (input: {
  subprocessMs: number;
}): number =>
  Math.max(
    1,
    input.subprocessMs - Math.min(60_000, Math.ceil(input.subprocessMs / 10)),
  );
