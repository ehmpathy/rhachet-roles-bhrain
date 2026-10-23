import type { ReviewRunMetricsRealizedOfResult } from '@src/domain.objects/Reviewer/ReviewRunMetricsRealizedOfResult';
import { asReviewTokensFromRealized } from '@src/domain.operations/review/asReviewTokensFromRealized';
import { getOneReviewTokensCount } from '@src/domain.operations/review/getOneReviewTokensCount';

/**
 * .what = the token rows a review's stdout states — the four axes plus their total, each
 *         null where the run's spend is unmeasured
 * .why = 🔴 a figure summed over the measured asks alone would read precise and low, beside
 *        a meter that grades the run `unknown`. so an unmeasured spend makes every token
 *        figure unknown, never the sum of the known parts (`0.wish`: never under-report).
 *        one home, so the step that runs one review and the step that merges a split state
 *        it the same way
 */
export const asReviewOutputTokensOfRealized = (input: {
  tokens: ReviewRunMetricsRealizedOfResult['tokens'];
}): {
  input: number | null;
  cacheSet: number | null;
  cacheGet: number | null;
  output: number | null;
  total: number | null;
} => {
  // an unmeasured spend leaves every token figure unknown
  if (input.tokens === null)
    return {
      input: null,
      cacheSet: null,
      cacheGet: null,
      output: null,
      total: null,
    };

  // a measured run: cast once at the named seam, so this stdout and the meter read one axis list
  const tokens = asReviewTokensFromRealized({ tokens: input.tokens });
  return { ...tokens, total: getOneReviewTokensCount({ tokens }) };
};
