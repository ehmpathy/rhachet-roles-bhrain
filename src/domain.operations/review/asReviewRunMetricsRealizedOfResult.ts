import type { ReviewRunMetricsRealized } from '@src/domain.objects/Reviewer/ReviewRunMetricsRealized';
import type { ReviewRunMetricsRealizedOfResult } from '@src/domain.objects/Reviewer/ReviewRunMetricsRealizedOfResult';

/**
 * .what = a run's realized figures as it returns them: whole where its spend was measured,
 *         with cost and every token figure null where it was not
 * .why = 🔴 the ONE definition of "an unmeasured spend carries no cost and no token count".
 *        the step that returns a run and the merge of a split lane both read the null this
 *        writes, so no caller restates the rule and none can null one figure without the
 *        others (`0.wish`: never under-report)
 */
export const asReviewRunMetricsRealizedOfResult = (input: {
  realized: Omit<ReviewRunMetricsRealized, 'compiled' | 'supply' | 'runaways'>;
  /**
   * false where any ask was billed with no reported spend — a reply that ran to its output
   * limit with no reported output count, or a fault a retry swallowed that may have been billed
   */
  measured: boolean;
}): ReviewRunMetricsRealizedOfResult => {
  // a measured spend returns whole
  if (input.measured) return input.realized;

  // an unmeasured spend states no cost and no token count, all at once
  return {
    ...input.realized,
    tokens: null,
    cost: null,
  };
};
