import type { ReviewRunArgsRecord } from '@src/domain.objects/Reviewer/ReviewRunArgsRecord';
import type { ReviewRunMetricsExpected } from '@src/domain.objects/Reviewer/ReviewRunMetricsExpected';

/**
 * .what = the projection triple the replay record carries, read off the expected metrics
 * .why = `metrics.expected.json` OWNS the three projected figures; `input.args.json` keeps
 *        a copy in its own keys so a replay reads one file. one cast from the one source,
 *        both sides bound to a declared type, means a rename on either side fails the
 *        type check rather than let the two artifacts disagree
 */
export const asReviewRunArgsMetricsOfExpected = (input: {
  expected: ReviewRunMetricsExpected;
}): ReviewRunArgsRecord['metrics'] => ({
  tokenEstimate: input.expected.tokens.estimate,
  contextWindowPercent: input.expected.tokens.contextWindowPercent,
  costEstimate: input.expected.cost.estimate,
});
