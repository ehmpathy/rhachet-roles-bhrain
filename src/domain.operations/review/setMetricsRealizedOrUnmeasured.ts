import type { ReviewRunMetricsRealized } from '@src/domain.objects/Reviewer/ReviewRunMetricsRealized';
import type { ReviewRunMetricsRealizedOfResult } from '@src/domain.objects/Reviewer/ReviewRunMetricsRealizedOfResult';
import { asReviewRunMetricsRealizedOfResult } from '@src/domain.operations/review/asReviewRunMetricsRealizedOfResult';
import { asSpendUnmeasuredLine } from '@src/domain.operations/review/asSpendUnmeasuredLine';
import { setMetricsRealized } from '@src/domain.operations/review/setMetricsRealized';

/**
 * .what = records a run's realized figures where its spend was measured; where it was not,
 *         writes no artifact, says so on stderr, and returns the figures nulled
 * .why = 🔴 the ONE home of "never under-report" at write time (`0.wish`). an ask billed with
 *        no reported spend — a runaway with no output count, or a fault a retry swallowed —
 *        cannot be priced, and a total stated without it would read low. so the meter must
 *        find no realized artifact (it grades the run `unknown` and renders its cost absent),
 *        and the run's own stdout and sdk return must state the same verdict. a review ask
 *        and a partition prime both end here, so the two can never part on the rule
 */
export const setMetricsRealizedOrUnmeasured = async (input: {
  logDir: string;
  /** the run's realized figures — what it returns, and the body of its artifact */
  realized: Omit<ReviewRunMetricsRealized, 'compiled' | 'supply' | 'runaways'>;
  /** the fields only the artifact carries */
  record: Pick<ReviewRunMetricsRealized, 'compiled' | 'supply' | 'runaways'>;
  /** how many asks were billed with no reported spend; zero means measured */
  unmeasured: number;
}): Promise<ReviewRunMetricsRealizedOfResult> => {
  // an unmeasured spend writes no artifact, and names itself
  const measured = input.unmeasured === 0;
  if (!measured)
    console.error(asSpendUnmeasuredLine({ unmeasured: input.unmeasured }));
  if (measured)
    await setMetricsRealized({
      logDir: input.logDir,
      metrics: { ...input.realized, ...input.record },
    });

  // the figures the run returns and prints state the verdict the artifact does
  return asReviewRunMetricsRealizedOfResult({
    realized: input.realized,
    measured,
  });
};
