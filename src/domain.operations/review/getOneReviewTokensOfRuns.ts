import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import type { ReviewTokens } from '@src/domain.objects/Reviewer/ReviewTokens';
import { getOneReviewTokensSummed } from '@src/domain.operations/review/getOneReviewTokensSummed';
import { getAllRunsMetered } from '@src/domain.operations/review/meter/getAllRunsMetered';

/**
 * .what = sums the disjoint token axes over the METERED runs of a set
 * .why = the meter and the grove both fold runs; each reads this, and this reads the one
 *        sum law (`getOneReviewTokensSummed`). lives at `review/` since neither owns it
 *        (rule.prefer.most-common-denominator)
 *
 * .note = 🔴 the fold owns the metered filter (`getAllRunsMetered`), so every caller sums
 *         the same runs. a run of any other grade carries no measured tokens; the caller's
 *         census, never this sum, carries it as `unknown`. when the filter sat at each call
 *         site, one of four callers skipped it, and a later grade with partial tokens would
 *         have parted the per-day chart from the grove total
 *
 * .note = the four axes stay apart in the result. to collapse one record to a
 *         single number is its peer's job, `getOneReviewTokensCount`
 */
export const getOneReviewTokensOfRuns = (input: {
  runs: ReviewRunMeter[];
}): ReviewTokens =>
  getOneReviewTokensSummed({
    tokens: getAllRunsMetered({ runs: input.runs }).flatMap((one) =>
      one.tokens ? [one.tokens] : [],
    ),
  });
