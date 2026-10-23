import type { ReviewRunIdentity } from '@src/domain.objects/Reviewer/ReviewRunIdentity';
import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';

/**
 * .what = a run whose guard identity is on record
 * .why = only a guard run names a reviewer, so only a guard run has a prior round
 */
export type ReviewRunMeterOfGuard = ReviewRunMeter & {
  identity: ReviewRunIdentity;
};

/**
 * .what = whether a run carries a guard identity
 * .why = the narrow the prefix pair walks filter through, in place of a cast
 */
export const isReviewRunOfGuard = (
  run: ReviewRunMeter,
): run is ReviewRunMeterOfGuard => run.identity !== null;
